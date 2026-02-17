"use strict";
/**
 * Completion provider — offers keyword auto-completion and
 * symbol-based completion for Catapillar files.
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
exports.CatapillarCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const keywords_1 = require("./keywords");
const parser_1 = require("./parser");
class CatapillarCompletionProvider {
    provideCompletionItems(document, position, _token, _context) {
        const config = vscode.workspace.getConfiguration('catapillar');
        const showChinese = config.get('completion.showChineseKeywords', true);
        const showEnglish = config.get('completion.showEnglishKeywords', true);
        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character).trimStart();
        const items = [];
        // If at the start of a line, suggest line states, actions, and control keywords
        const isLineStart = textBefore.length === 0 || /^[~><!?]\s*$/.test(textBefore);
        const prefix = this.getCurrentWord(textBefore, isLineStart);
        if (isLineStart) {
            // Line state completions
            for (const ls of keywords_1.LINE_STATES) {
                const item = new vscode.CompletionItem(ls.forms[0], vscode.CompletionItemKind.Operator);
                item.detail = ls.description.en;
                item.documentation = new vscode.MarkdownString(ls.detail.en);
                item.sortText = '0' + ls.forms[0];
                items.push(item);
            }
            // Action and control keyword completions — match language of what user is typing
            const allKeywords = [...keywords_1.KEYWORDS, ...keywords_1.STRUCT_KEYWORDS];
            for (const kw of allKeywords) {
                const kwItems = this.createKeywordItems(kw, showChinese, showEnglish, prefix);
                items.push(...kwItems);
            }
        }
        else {
            // Mid-line: suggest based on context
            const parts = textBefore.split(/\s+/);
            const firstWord = parts[0];
            // After 若/if, 又若/elif, 当/while — suggest operators and symbols
            if (['若', 'if', '又若', 'elif', '当', 'while'].includes(firstWord)) {
                for (const op of keywords_1.OPERATOR_KEYWORDS) {
                    const item = new vscode.CompletionItem(op.form, vscode.CompletionItemKind.Operator);
                    item.detail = `${op.meaning} — ${op.description.en}`;
                    items.push(item);
                }
            }
            // After 调/call — suggest defined function names
            if (['调', 'call'].includes(firstWord)) {
                items.push(...this.getSymbolCompletions(document, 'function'));
            }
            // After 置/set — suggest variable names as first arg, then functions/values
            if (['置', 'set'].includes(firstWord)) {
                if (parts.length <= 2) {
                    items.push(...this.getSymbolCompletions(document, 'variable'));
                }
                else {
                    // After variable name, suggest arithmetic and built-in functions
                    const lastWord = parts[parts.length - 1] ?? '';
                    for (const kw of keywords_1.KEYWORDS.filter(k => k.category === 'arithmetic')) {
                        items.push(...this.createKeywordItems(kw, showChinese, showEnglish, lastWord));
                    }
                    // Built-in function suggestions
                    for (const fn of ['input', 'float', 'int', 'str']) {
                        const item = new vscode.CompletionItem(fn, vscode.CompletionItemKind.Function);
                        item.detail = `Built-in: ${fn}()`;
                        items.push(item);
                    }
                }
            }
            // Always suggest defined symbols
            items.push(...this.getSymbolCompletions(document, 'all'));
        }
        return items;
    }
    getCurrentWord(textBefore, isLineStart) {
        if (!textBefore.trim())
            return '';
        if (isLineStart)
            return textBefore.trim().split(/\s+/)[0] ?? '';
        const parts = textBefore.trim().split(/\s+/);
        return parts[parts.length - 1] ?? '';
    }
    createKeywordItems(kw, showChinese, showEnglish, prefix = '') {
        const items = [];
        const kind = kw.category === 'control'
            ? vscode.CompletionItemKind.Keyword
            : kw.category === 'arithmetic'
                ? vscode.CompletionItemKind.Operator
                : kw.category === 'struct'
                    ? vscode.CompletionItemKind.Struct
                    : vscode.CompletionItemKind.Function;
        const prefixHasLatin = prefix.length > 0 && /[a-zA-Z]/.test(prefix);
        const prefixHasCJK = prefix.length > 0 && /[\u4e00-\u9fff]/.test(prefix);
        for (const form of kw.forms) {
            const isChinese = /[\u4e00-\u9fff]/.test(form);
            if (prefixHasLatin && isChinese)
                continue;
            if (prefixHasCJK && !isChinese)
                continue;
            if (isChinese && !showChinese) {
                continue;
            }
            if (!isChinese && !showEnglish) {
                continue;
            }
            const item = new vscode.CompletionItem(form, kind);
            item.detail = `[${kw.actionId}] ${kw.description.en}`;
            item.documentation = new vscode.MarkdownString(kw.detail.en);
            // Add insert text with block structure for block-opening keywords
            if (kw.opensBlock) {
                item.insertText = new vscode.SnippetString(`${form} \${1}:\n\${2}\n终`);
            }
            const prefix = kw.category === 'control' ? '1'
                : kw.category === 'action' ? '2'
                    : kw.category === 'arithmetic' ? '3'
                        : '4';
            item.sortText = prefix + form;
            items.push(item);
        }
        return items;
    }
    getSymbolCompletions(document, kind) {
        const items = [];
        const source = document.getText();
        const result = (0, parser_1.parseSource)(source);
        if (kind === 'function' || kind === 'all') {
            for (const sym of (0, parser_1.getFunctionSymbols)(result)) {
                const item = new vscode.CompletionItem(sym.name, vscode.CompletionItemKind.Function);
                item.detail = sym.params && sym.params.length > 0
                    ? `定 ${sym.name}(${sym.params.join(', ')})`
                    : `定 ${sym.name}()`;
                item.documentation = `Defined at line ${sym.lineno}`;
                items.push(item);
            }
        }
        if (kind === 'variable' || kind === 'all') {
            const seen = new Set();
            for (const sym of (0, parser_1.getVariableSymbols)(result)) {
                if (seen.has(sym.name)) {
                    continue;
                }
                seen.add(sym.name);
                const item = new vscode.CompletionItem(sym.name, vscode.CompletionItemKind.Variable);
                item.detail = `variable (line ${sym.lineno})`;
                items.push(item);
            }
        }
        return items;
    }
}
exports.CatapillarCompletionProvider = CatapillarCompletionProvider;
//# sourceMappingURL=completionProvider.js.map