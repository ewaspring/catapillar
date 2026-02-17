"use strict";
/**
 * Formatting provider — formats Catapillar source code with
 * consistent indentation based on block structure.
 *
 * Catapillar is indent-free by design, but optional indentation
 * can be applied for readability (controlled by settings).
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
exports.CatapillarFormattingProvider = void 0;
const vscode = __importStar(require("vscode"));
const keywords_1 = require("./keywords");
/** Keywords that close one indent level and open another (elif, else, except, finally) */
const DEDENT_THEN_INDENT = new Set([
    '又若', 'elif',
    '否则', 'else',
    '捕', 'except',
    '终于', 'finally',
]);
class CatapillarFormattingProvider {
    provideDocumentFormattingEdits(document, options, _token) {
        return this.formatRange(document, new vscode.Range(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length), options);
    }
    provideDocumentRangeFormattingEdits(document, range, options, _token) {
        return this.formatRange(document, range, options);
    }
    formatRange(document, range, options) {
        const config = vscode.workspace.getConfiguration('catapillar');
        const configIndent = config.get('formatting.indentSize', 0);
        const indentSize = configIndent > 0 ? configIndent : (options.insertSpaces ? options.tabSize : 0);
        if (indentSize === 0) {
            // Indent-free mode: just clean up trailing whitespace and blank lines
            return this.cleanupWhitespace(document, range);
        }
        const indentStr = options.insertSpaces ? ' '.repeat(indentSize) : '\t';
        const edits = [];
        let indentLevel = 0;
        let inBlockComment = false;
        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = document.lineAt(i);
            const trimmed = line.text.trim();
            // Empty lines: preserve
            if (trimmed === '') {
                continue;
            }
            // Block comments
            if (trimmed === '~~') {
                inBlockComment = !inBlockComment;
                const newText = trimmed;
                if (line.text !== newText) {
                    edits.push(vscode.TextEdit.replace(line.range, newText));
                }
                continue;
            }
            if (inBlockComment) {
                // Don't change indentation inside block comments
                continue;
            }
            // Comments: indent to current level
            if (trimmed.startsWith('#')) {
                const newText = indentStr.repeat(indentLevel) + trimmed;
                if (line.text !== newText) {
                    edits.push(vscode.TextEdit.replace(line.range, newText));
                }
                continue;
            }
            // Parse the line to determine its role
            const firstWord = this.getFirstWord(trimmed);
            // Block end (终/end/结束/完了) → dedent first, then format
            if (keywords_1.STRUCT_LOOKUP.has(firstWord)) {
                indentLevel = Math.max(0, indentLevel - 1);
                const newText = indentStr.repeat(indentLevel) + trimmed;
                if (line.text !== newText) {
                    edits.push(vscode.TextEdit.replace(line.range, newText));
                }
                continue;
            }
            // Dedent-then-indent keywords (elif, else, except, finally)
            const actionWord = this.getActionWord(trimmed);
            if (actionWord && DEDENT_THEN_INDENT.has(actionWord)) {
                indentLevel = Math.max(0, indentLevel - 1);
                const newText = indentStr.repeat(indentLevel) + trimmed;
                if (line.text !== newText) {
                    edits.push(vscode.TextEdit.replace(line.range, newText));
                }
                indentLevel++;
                continue;
            }
            // Normal line: apply current indent
            const newText = indentStr.repeat(indentLevel) + trimmed;
            if (line.text !== newText) {
                edits.push(vscode.TextEdit.replace(line.range, newText));
            }
            // Block openers (定, 若, 当, etc.) → indent after
            if (actionWord && this.isBlockOpener(actionWord, trimmed)) {
                indentLevel++;
            }
        }
        return edits;
    }
    cleanupWhitespace(document, range) {
        const edits = [];
        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = document.lineAt(i);
            const trimmedRight = line.text.trimEnd();
            if (line.text !== trimmedRight) {
                edits.push(vscode.TextEdit.replace(line.range, trimmedRight));
            }
        }
        return edits;
    }
    getFirstWord(trimmed) {
        const parts = trimmed.split(/\s+/);
        let idx = 0;
        if (parts.length > 0 && keywords_1.LINE_STATE_SET.has(parts[0])) {
            idx = 1;
        }
        return parts[idx] || '';
    }
    getActionWord(trimmed) {
        const parts = trimmed.split(/\s+/);
        let idx = 0;
        if (parts.length > 0 && keywords_1.LINE_STATE_SET.has(parts[0])) {
            idx = 1;
        }
        const word = parts[idx];
        if (!word) {
            return null;
        }
        return word.replace(/:$/, '');
    }
    isBlockOpener(actionWord, fullLine) {
        // Block openers must either be known block-opening keywords
        // or the line must end with ':'
        if (keywords_1.BLOCK_OPENERS.has(actionWord)) {
            return fullLine.trimEnd().endsWith(':');
        }
        // Named blocks (e.g. flow definitions) also end with ':'
        if (fullLine.trimEnd().endsWith(':') && !keywords_1.STRUCT_LOOKUP.has(actionWord)) {
            return keywords_1.ACTION_LOOKUP.has(actionWord) || !keywords_1.STRUCT_LOOKUP.has(actionWord);
        }
        return false;
    }
}
exports.CatapillarFormattingProvider = CatapillarFormattingProvider;
//# sourceMappingURL=formattingProvider.js.map