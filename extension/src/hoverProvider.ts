/**
 * Hover provider — shows keyword documentation and symbol info
 * when hovering over tokens in a Catapillar file.
 */

import * as vscode from 'vscode';
import { KEYWORD_BY_FORM, OPERATOR_KEYWORDS, NULL_LITERALS } from './keywords';
import { parseSource, getFunctionSymbols, getVariableSymbols } from './parser';

export class CatapillarHoverProvider implements vscode.HoverProvider {

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
    ): vscode.Hover | undefined {

        const wordRange = document.getWordRangeAtPosition(
            position,
            /[\w\u4e00-\u9fff]+/,
        );
        if (!wordRange) {
            // Check for line-state characters
            const char = document.getText(
                new vscode.Range(position, position.translate(0, 1)),
            );
            return this.getLineStateHover(char);
        }

        const word = document.getText(wordRange);

        // Check keyword database
        const kwInfo = KEYWORD_BY_FORM.get(word);
        if (kwInfo) {
            return this.buildKeywordHover(word, kwInfo);
        }

        // Check operator keywords
        for (const op of OPERATOR_KEYWORDS) {
            if (op.form === word) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(`**${op.form}** → \`${op.meaning}\`\n\n`);
                md.appendMarkdown(`${op.description.en} | ${op.description['zh-cn']} | ${op.description.ja}`);
                return new vscode.Hover(md, wordRange);
            }
        }

        // Null literals
        if (NULL_LITERALS.includes(word)) {
            const md = new vscode.MarkdownString();
            md.appendMarkdown(`**${word}** — null / None\n\n`);
            md.appendMarkdown(`Aliases: ${NULL_LITERALS.filter(l => l !== word).map(l => `\`${l}\``).join(', ')}`);
            return new vscode.Hover(md, wordRange);
        }

        // Check if it's a defined symbol
        return this.getSymbolHover(document, word, wordRange);
    }

    private buildKeywordHover(
        word: string,
        kwInfo: { actionId: string; forms: string[]; description: Record<string, string>; detail: Record<string, string>; category: string },
    ): vscode.Hover {
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

    private getLineStateHover(char: string): vscode.Hover | undefined {
        const lineStateInfo: Record<string, { name: string; desc: string }> = {
            '~': { name: 'Continue', desc: 'Default line state — continues current segment' },
            '>': { name: 'Advance', desc: 'Segment boundary — advance to next segment' },
            '<': { name: 'Return/Echo', desc: 'Return — refers back to previous segment' },
            '!': { name: 'Strong/Commit', desc: 'Critical action — must succeed' },
            '?': { name: 'Tentative/Await', desc: 'Awaiting external input' },
        };

        const info = lineStateInfo[char];
        if (!info) { return undefined; }

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**Line State \`${char}\`** — ${info.name}\n\n`);
        md.appendMarkdown(info.desc);
        return new vscode.Hover(md);
    }

    private getSymbolHover(
        document: vscode.TextDocument,
        word: string,
        wordRange: vscode.Range,
    ): vscode.Hover | undefined {
        const source = document.getText();
        const result = parseSource(source);

        // Check functions
        for (const sym of getFunctionSymbols(result)) {
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
        for (const sym of getVariableSymbols(result)) {
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
