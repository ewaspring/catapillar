"use strict";
/**
 * Catapillar parser — TypeScript port of parser/parser.py.
 * Converts tokens into an AST.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSource = parseSource;
exports.getFunctionSymbols = getFunctionSymbols;
exports.getVariableSymbols = getVariableSymbols;
const tokenizer_1 = require("./tokenizer");
const keywords_1 = require("./keywords");
/**
 * Parse source code into a Catapillar AST with diagnostics.
 * Unlike the Python parser, this does NOT throw on errors — it collects
 * diagnostics so the extension can show them all at once.
 */
function parseSource(source) {
    const { tokens, warnings } = (0, tokenizer_1.tokenizeSource)(source);
    const diagnostics = warnings.map(w => ({
        message: w.message,
        lineno: w.lineno,
        severity: 'warning',
    }));
    const symbols = [];
    const program = {
        type: 'Program',
        flows: [],
    };
    const currentFlow = {
        type: 'Flow',
        segments: [],
    };
    let currentSegment = {
        type: 'Segment',
        lines: [],
    };
    const blockStack = [];
    for (const token of tokens) {
        const { rawAction, rawArgs, lineState, lineno } = token;
        // Struct keywords (block end)
        if (keywords_1.STRUCT_LOOKUP.has(rawAction)) {
            const structId = keywords_1.STRUCT_LOOKUP.get(rawAction);
            if (structId === 'BLOCK_END') {
                if (blockStack.length === 0) {
                    diagnostics.push({
                        message: `Unexpected block end '${rawAction}' without matching block opener`,
                        lineno,
                        severity: 'warning',
                    });
                }
                else {
                    blockStack.pop();
                }
                currentSegment.lines.push({
                    type: 'BLOCK_END',
                    lineState,
                    lineno,
                });
            }
            continue;
        }
        // Validate line state
        if (!keywords_1.LINE_STATE_SET.has(lineState)) {
            diagnostics.push({
                message: `Invalid line state: ${lineState}`,
                lineno,
                severity: 'error',
            });
            continue;
        }
        // Detect arrow syntax
        let arrowType = null;
        if (rawArgs.includes('->')) {
            arrowType = '->';
        }
        else if (rawArgs.includes('<-')) {
            arrowType = '<-';
        }
        // Block definition (action ends with :)
        if (rawAction.endsWith(':')) {
            const blockName = rawAction.slice(0, -1);
            // Check for control keywords that end with colon
            if (['否则', 'else'].includes(blockName)) {
                // ELSE is continuation of IF/ELIF chain — pop previous branch
                if (blockStack.length > 0 && (blockStack[blockStack.length - 1] === 'IF' || blockStack[blockStack.length - 1] === 'ELIF')) {
                    blockStack.pop();
                }
                blockStack.push('ELSE');
                currentSegment.lines.push({
                    type: 'Line',
                    action: 'ELSE',
                    args: [],
                    lineState,
                    lineno,
                });
                continue;
            }
            if (['试', 'try'].includes(blockName)) {
                blockStack.push('TRY');
                currentSegment.lines.push({
                    type: 'Line',
                    action: 'TRY',
                    args: [],
                    lineState,
                    lineno,
                });
                continue;
            }
            if (['终于', 'finally'].includes(blockName)) {
                // FINALLY is continuation of TRY/EXCEPT chain — pop previous branch
                if (blockStack.length > 0 && (blockStack[blockStack.length - 1] === 'TRY' || blockStack[blockStack.length - 1] === 'EXCEPT')) {
                    blockStack.pop();
                }
                blockStack.push('FINALLY');
                currentSegment.lines.push({
                    type: 'Line',
                    action: 'FINALLY',
                    args: [],
                    lineState,
                    lineno,
                });
                continue;
            }
            // Named flow block (e.g. ~ 成功流程:) — push so matching 'end' pops
            blockStack.push('FLOW_BLOCK');
            currentSegment.lines.push({
                type: 'Block',
                name: blockName,
                lineState,
                lineno,
            });
            continue;
        }
        // Arrow lines
        if (arrowType) {
            const idx = rawArgs.indexOf(arrowType);
            if (idx + 1 >= rawArgs.length) {
                diagnostics.push({
                    message: 'Arrow missing target',
                    lineno,
                    severity: 'error',
                });
                continue;
            }
            const left = rawAction;
            const right = rawArgs[idx + 1];
            currentSegment.lines.push({
                type: 'Arrow',
                from: arrowType === '->' ? left : right,
                to: arrowType === '->' ? right : left,
                direction: arrowType,
                lineState,
                lineno,
            });
        }
        // Legacy action lines
        else {
            // Strip trailing colon from action for lookup
            let lookupAction = rawAction;
            let processedArgs = [...rawArgs];
            if (lookupAction.endsWith(':')) {
                lookupAction = lookupAction.slice(0, -1);
            }
            if (!keywords_1.ACTION_LOOKUP.has(lookupAction)) {
                diagnostics.push({
                    message: `Unknown action: ${rawAction}`,
                    lineno,
                    severity: 'error',
                    colStart: token.colOffset,
                    colEnd: token.colOffset + rawAction.length,
                });
                continue;
            }
            const actionId = keywords_1.ACTION_LOOKUP.get(lookupAction);
            // Track block-opening actions (ELIF/EXCEPT replace previous branch on stack)
            if (actionId === 'ELIF') {
                if (blockStack.length > 0 && (blockStack[blockStack.length - 1] === 'IF' || blockStack[blockStack.length - 1] === 'ELIF')) {
                    blockStack.pop();
                }
                blockStack.push(actionId);
            }
            else if (actionId === 'EXCEPT') {
                if (blockStack.length > 0 && (blockStack[blockStack.length - 1] === 'TRY' || blockStack[blockStack.length - 1] === 'EXCEPT')) {
                    blockStack.pop();
                }
                blockStack.push(actionId);
            }
            else if (['DEF', 'IF', 'WHILE', 'FOR', 'TRY'].includes(actionId)) {
                blockStack.push(actionId);
            }
            // Collect symbol info for definitions
            if (actionId === 'DEF' && rawArgs.length > 0) {
                const funcName = rawArgs[0].replace(/:$/, '');
                const params = rawArgs.slice(1).map(p => p.replace(/:$/, ''));
                symbols.push({
                    name: funcName,
                    kind: 'function',
                    lineno,
                    params,
                });
            }
            if (actionId === 'SET' && rawArgs.length >= 2) {
                symbols.push({
                    name: rawArgs[0],
                    kind: 'variable',
                    lineno,
                });
            }
            // Strip trailing colon from last arg (e.g. "若 cond:" → args with colon)
            if (processedArgs.length > 0 && processedArgs[processedArgs.length - 1].endsWith(':')) {
                processedArgs[processedArgs.length - 1] =
                    processedArgs[processedArgs.length - 1].slice(0, -1);
            }
            currentSegment.lines.push({
                type: 'Line',
                action: actionId,
                args: processedArgs,
                lineState,
                lineno,
            });
        }
        // Segment closing on >
        if (lineState === '>') {
            currentFlow.segments.push(currentSegment);
            currentSegment = { type: 'Segment', lines: [] };
        }
    }
    // Check for unclosed blocks
    if (blockStack.length > 0) {
        diagnostics.push({
            message: `Unclosed block(s): expected ${blockStack.length} more '终/end' statement(s)`,
            lineno: tokens.length > 0 ? tokens[tokens.length - 1].lineno : 1,
            severity: 'warning',
        });
    }
    // Flush
    if (currentSegment.lines.length > 0) {
        currentFlow.segments.push(currentSegment);
    }
    if (currentFlow.segments.length > 0) {
        program.flows.push(currentFlow);
    }
    return { program, diagnostics, symbols };
}
/**
 * Get all defined function names from a parsed result.
 */
function getFunctionSymbols(result) {
    return result.symbols.filter(s => s.kind === 'function');
}
/**
 * Get all variable assignments from a parsed result.
 */
function getVariableSymbols(result) {
    return result.symbols.filter(s => s.kind === 'variable');
}
//# sourceMappingURL=parser.js.map