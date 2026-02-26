"use strict";
/**
 * Hover provider — shows keyword documentation and symbol info
 * when hovering over tokens in a Catapillar file.
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
exports.CatapillarHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const keywords_1 = require("./keywords");
const parser_1 = require("./parser");
class CatapillarHoverProvider {
    provideHover(document, position, _token) {
        const wordRange = document.getWordRangeAtPosition(position, /[\w\u4e00-\u9fff]+/);
        if (!wordRange) {
            // Check for line-state characters
            const char = document.getText(new vscode.Range(position, position.translate(0, 1)));
            return this.getLineStateHover(char);
        }
        const word = document.getText(wordRange);
        // Check keyword database
        const kwInfo = keywords_1.KEYWORD_BY_FORM.get(word);
        if (kwInfo) {
            return this.buildKeywordHover(word, kwInfo);
        }
        // Check operator keywords
        for (const op of keywords_1.OPERATOR_KEYWORDS) {
            if (op.form === word) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(`**${op.form}** → \`${op.meaning}\`\n\n`);
                md.appendMarkdown(`${op.description.en} | ${op.description['zh-cn']} | ${op.description.ja}`);
                return new vscode.Hover(md, wordRange);
            }
        }
        // Null literals
        if (keywords_1.NULL_LITERALS.includes(word)) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${word}** — null / None\n\n`);
            md.appendMarkdown(`Aliases: ${keywords_1.NULL_LITERALS.filter(l => l !== word).map(l => `\`${l}\``).join(', ')}`);
            return new vscode.Hover(md, wordRange);
        }
        // Check if it's a defined symbol
        return this.getSymbolHover(document, word, wordRange);
    }
    buildKeywordHover(word, kwInfo) {
        const md = new vscode.MarkdownString();
        // Header with action ID
        md.appendMarkdown(`**${word}** \`[${kwInfo.actionId}]\`\n\n`);
        // All surface forms
        const otherForms = kwInfo.forms.filter(f => f !== word);
        if (otherForms.length > 0) {
            md.appendMarkdown(`Aliases: ${otherForms.map(f => `\`${f}\``).join(', ')}\n\n`);
        }
        // Category badge
        md.appendMarkdown(`Category: *${kwInfo.category}*\n\n`);
        // Multilingual descriptions
        md.appendMarkdown('---\n\n');
        md.appendMarkdown(`${kwInfo.detail.en}\n\n`);
        md.appendMarkdown(`${kwInfo.detail['zh-cn']}\n\n`);
        md.appendMarkdown(`${kwInfo.detail.ja}\n`);
        return new vscode.Hover(md);
    }
    getLineStateHover(char) {
        const lineStateInfo = {
            '~': { name: 'Continue', desc: 'Default line state — continues current segment' },
            '>': { name: 'Advance', desc: 'Segment boundary — advance to next segment' },
            '<': { name: 'Return/Echo', desc: 'Return — refers back to previous segment' },
            '!': { name: 'Strong/Commit', desc: 'Critical action — must succeed' },
            '?': { name: 'Tentative/Await', desc: 'Awaiting external input' },
        };
        const info = lineStateInfo[char];
        if (!info) {
            return undefined;
        }
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**Line State \`${char}\`** — ${info.name}\n\n`);
        md.appendMarkdown(info.desc);
        return new vscode.Hover(md);
    }
    getSymbolHover(document, word, wordRange) {
        const source = document.getText();
        const result = (0, parser_1.parseSource)(source);
        // Check functions
        for (const sym of (0, parser_1.getFunctionSymbols)(result)) {
            if (sym.name === word) {
                const md = new vscode.MarkdownString();
                const paramStr = sym.params && sym.params.length > 0
                    ? sym.params.join(', ')
                    : '';
                md.appendCodeblock(`定 ${sym.name}(${paramStr})`, 'catapillar');
                md.appendMarkdown(`\n\nDefined at line ${sym.lineno}`);
                return new vscode.Hover(md, wordRange);
            }
        }
        // Check variables (first assignment)
        for (const sym of (0, parser_1.getVariableSymbols)(result)) {
            if (sym.name === word) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(`**variable** \`${sym.name}\`\n\n`);
                md.appendMarkdown(`First assigned at line ${sym.lineno}`);
                return new vscode.Hover(md, wordRange);
            }
        }
        return undefined;
    }
}
exports.CatapillarHoverProvider = CatapillarHoverProvider;
//# sourceMappingURL=hoverProvider.js.map