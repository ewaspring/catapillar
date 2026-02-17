"use strict";
/**
 * Code action provider — refactoring support for Catapillar files.
 * Supports:
 *   - Extract Variable: wrap selected expression in a 置 (SET) statement
 *   - Extract Function: wrap selected lines in a 定 (DEF) block
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatapillarCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class CatapillarCodeActionProvider {
    provideCodeActions(document, range, _context, _token) {
        const actions = [];
        if (range.isEmpty) {
            return actions;
        }
        const selectedText = document.getText(range).trim();
        if (!selectedText) {
            return actions;
        }
        // Extract Variable — only for single-line inline expressions
        if (range.start.line === range.end.line && selectedText.length > 0) {
            const extractVar = this.createExtractVariable(document, range, selectedText);
            if (extractVar) {
                actions.push(extractVar);
            }
        }
        // Extract Function — for multi-line selections
        if (range.start.line !== range.end.line ||
            (range.start.line === range.end.line && selectedText.includes(' '))) {
            const extractFunc = this.createExtractFunction(document, range, selectedText);
            if (extractFunc) {
                actions.push(extractFunc);
            }
        }
        return actions;
    }
    createExtractVariable(document, range, selectedText) {
        // Don't extract if the selection is an entire line starting with an action
        const lineText = document.lineAt(range.start.line).text.trim();
        if (selectedText === lineText) {
            return null;
        }
        const action = new vscode.CodeAction('Extract to variable (置)', vscode.CodeActionKind.RefactorExtract);
        action.edit = new vscode.WorkspaceEdit();
        const varName = 'newVar';
        const line = range.start.line;
        const lineStart = document.lineAt(line).range.start;
        // Get indentation of current line
        const currentLine = document.lineAt(line).text;
        const indentMatch = currentLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        // Insert 置 statement before the current line
        action.edit.insert(document.uri, lineStart, `${indent}置 ${varName} ${selectedText}\n`);
        // Replace selected text with variable name
        // Adjust range because we inserted a line above
        const adjustedRange = new vscode.Range(range.start.translate(1, 0), range.end.translate(1, 0));
        action.edit.replace(document.uri, adjustedRange, varName);
        return action;
    }
    createExtractFunction(document, range, selectedText) {
        const action = new vscode.CodeAction('Extract to function (定)', vscode.CodeActionKind.RefactorExtract);
        action.edit = new vscode.WorkspaceEdit();
        const funcName = 'newFunc';
        // Get lines to extract
        const startLine = range.start.line;
        const endLine = range.end.line;
        // Get indentation of first selected line
        const firstLine = document.lineAt(startLine).text;
        const indentMatch = firstLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        // Build function body from selected lines
        const bodyLines = [];
        for (let i = startLine; i <= endLine; i++) {
            bodyLines.push(document.lineAt(i).text);
        }
        const body = bodyLines.join('\n');
        // Build the function definition (placed before the selection)
        const funcDef = `定 ${funcName}:\n${body}\n终\n\n`;
        // Find a good place to insert the function (before the current block or at file start)
        const insertPos = this.findFunctionInsertPosition(document, startLine);
        // Insert function definition
        action.edit.insert(document.uri, insertPos, funcDef);
        // Replace selected range with a call
        const fullRange = new vscode.Range(new vscode.Position(startLine, 0), new vscode.Position(endLine, document.lineAt(endLine).text.length));
        // Adjust for inserted lines
        const insertedLineCount = funcDef.split('\n').length - 1;
        const adjustedRange = new vscode.Range(fullRange.start.translate(insertedLineCount, 0), fullRange.end.translate(insertedLineCount, 0));
        action.edit.replace(document.uri, adjustedRange, `${indent}调 ${funcName}`);
        return action;
    }
    findFunctionInsertPosition(document, currentLine) {
        // Walk backwards to find the start of the current top-level block
        // or use line 0 if we're already at top level
        for (let i = currentLine - 1; i >= 0; i--) {
            const line = document.lineAt(i).text.trim();
            // Found start of a function definition
            if (/^(定|def)\s+/.test(line)) {
                return new vscode.Position(i, 0);
            }
            // Found an empty line at top level — insert after it
            if (line === '' && i < currentLine - 1) {
                return new vscode.Position(i + 1, 0);
            }
        }
        // Default: insert at the very beginning
        return new vscode.Position(0, 0);
    }
}
exports.CatapillarCodeActionProvider = CatapillarCodeActionProvider;
CatapillarCodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.RefactorExtract,
];
//# sourceMappingURL=codeActionProvider.js.map