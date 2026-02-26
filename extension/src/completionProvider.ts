/**
 * Completion provider — offers keyword auto-completion and
 * symbol-based completion for Catapillar files.
 */

import * as vscode from 'vscode';
import {
    KEYWORDS, STRUCT_KEYWORDS, IN_KEYWORDS, LINE_STATES, OPERATOR_KEYWORDS, NULL_LITERALS,
    KeywordInfo,
} from './keywords';
import { parseSource, getFunctionSymbols, getVariableSymbols } from './parser';

export class CatapillarCompletionProvider implements vscode.CompletionItemProvider {

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext,
    ): vscode.CompletionItem[] {

        const config = vscode.workspace.getConfiguration('catapillar');
        const showChinese = config.get<boolean>('completion.showChineseKeywords', true);
        const showEnglish = config.get<boolean>('completion.showEnglishKeywords', true);

        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character).trimStart();

        const items: vscode.CompletionItem[] = [];

        // If at the start of a line, suggest line states, actions, and control keywords
        const isLineStart = textBefore.length === 0 || /^[~><!?]\s*$/.test(textBefore);

        const prefix = this.getCurrentWord(textBefore, isLineStart);

        if (isLineStart) {
            // Line state completions
            for (const ls of LINE_STATES) {
                const item = new vscode.CompletionItem(
                    ls.forms[0],
                    vscode.CompletionItemKind.Operator,
                );
                item.detail = ls.description.en;
                item.documentation = new vscode.MarkdownString(ls.detail.en);
                item.sortText = '0' + ls.forms[0];
                items.push(item);
            }

            // Action and control keyword completions — match language of what user is typing
            const allKeywords = [...KEYWORDS, ...STRUCT_KEYWORDS];
            for (const kw of allKeywords) {
                const kwItems = this.createKeywordItems(kw, showChinese, showEnglish, prefix);
                items.push(...kwItems);
            }
        } else {
            // Mid-line: suggest based on context
            const parts = textBefore.split(/\s+/);
            const firstWord = parts[0];

            // After 若/if, 又若/elif, 当/while — suggest operators and symbols
            if (['若', 'if', '又若', 'elif', '当', 'while'].includes(firstWord)) {
                for (const op of OPERATOR_KEYWORDS) {
                    const item = new vscode.CompletionItem(
                        op.form,
                        vscode.CompletionItemKind.Operator,
                    );
                    item.detail = `${op.meaning} — ${op.description.en}`;
                    items.push(item);
                }
            }

            // After 调/call — suggest defined function names
            if (['调', 'call'].includes(firstWord)) {
                items.push(...this.getSymbolCompletions(document, 'function'));
            }

            // After 扭扭/for/回す — suggest 在/in/中
            if (['扭扭', 'for', '回す'].includes(firstWord) && parts.length === 2) {
                for (const kw of IN_KEYWORDS) {
                    for (const form of kw.forms) {
                        const item = new vscode.CompletionItem(form, vscode.CompletionItemKind.Keyword);
                        item.detail = kw.description.en;
                        item.documentation = new vscode.MarkdownString(kw.detail.en);
                        items.push(item);
                    }
                }
            }

            // After 置/set — suggest variable names as first arg, then functions/values
            if (['置', 'set'].includes(firstWord)) {
                if (parts.length <= 2) {
                    items.push(...this.getSymbolCompletions(document, 'variable'));
                } else {
                    // After variable name, suggest arithmetic and built-in functions
                    const lastWord = parts[parts.length - 1] ?? '';
                    for (const kw of KEYWORDS.filter(k => k.category === 'arithmetic')) {
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

            // Null literals in expression context
            for (const lit of NULL_LITERALS) {
                const item = new vscode.CompletionItem(lit, vscode.CompletionItemKind.Value);
                item.detail = 'null / None';
                items.push(item);
            }

            // Always suggest defined symbols
            items.push(...this.getSymbolCompletions(document, 'all'));
        }

        return items;
    }

    private getCurrentWord(textBefore: string, isLineStart: boolean): string {
        if (!textBefore.trim()) return '';
        if (isLineStart) return textBefore.trim().split(/\s+/)[0] ?? '';
        const parts = textBefore.trim().split(/\s+/);
        return parts[parts.length - 1] ?? '';
    }

    private createKeywordItems(
        kw: KeywordInfo,
        showChinese: boolean,
        showEnglish: boolean,
        prefix: string = '',
    ): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

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
            if (prefixHasLatin && isChinese) continue;
            if (prefixHasCJK && !isChinese) continue;
            if (isChinese && !showChinese) { continue; }
            if (!isChinese && !showEnglish) { continue; }

            const item = new vscode.CompletionItem(form, kind);
            item.detail = `[${kw.actionId}] ${kw.description.en}`;
            item.documentation = new vscode.MarkdownString(kw.detail.en);

            // Add insert text with block structure for block-opening keywords
            if (kw.opensBlock) {
                if (kw.actionId === 'FOR') {
                    item.insertText = new vscode.SnippetString(`${form} \${1} 在 \${2}:\n\${3}\n终`);
                } else {
                    item.insertText = new vscode.SnippetString(`${form} \${1}:\n\${2}\n终`);
                }
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

    private getSymbolCompletions(
        document: vscode.TextDocument,
        kind: 'function' | 'variable' | 'all',
    ): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const source = document.getText();
        const result = parseSource(source);

        if (kind === 'function' || kind === 'all') {
            for (const sym of getFunctionSymbols(result)) {
                const item = new vscode.CompletionItem(
                    sym.name,
                    vscode.CompletionItemKind.Function,
                );
                item.detail = sym.params && sym.params.length > 0
                    ? `定 ${sym.name}(${sym.params.join(', ')})`
                    : `定 ${sym.name}()`;
                item.documentation = `Defined at line ${sym.lineno}`;
                items.push(item);
            }
        }

        if (kind === 'variable' || kind === 'all') {
            const seen = new Set<string>();
            for (const sym of getVariableSymbols(result)) {
                if (seen.has(sym.name)) { continue; }
                seen.add(sym.name);
                const item = new vscode.CompletionItem(
                    sym.name,
                    vscode.CompletionItemKind.Variable,
                );
                item.detail = `variable (line ${sym.lineno})`;
                items.push(item);
            }
        }

        return items;
    }
}
