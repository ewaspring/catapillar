/**
 * Formatting provider — formats Catapillar source code with
 * consistent indentation based on block structure.
 *
 * Catapillar is indent-free by design, but optional indentation
 * can be applied for readability (controlled by settings).
 */

import * as vscode from 'vscode';
import { ACTION_LOOKUP, STRUCT_LOOKUP, LINE_STATE_SET, BLOCK_OPENERS } from './keywords';

/** Keywords that close one indent level and open another (elif, else, except, finally) */
const DEDENT_THEN_INDENT = new Set([
    '又若', 'elif',
    '否则', 'else',
    '捕', 'except',
    '终于', 'finally',
]);

export class CatapillarFormattingProvider
    implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {

    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken,
    ): vscode.TextEdit[] {
        return this.formatRange(
            document,
            new vscode.Range(0, 0, document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length),
            options,
        );
    }

    provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken,
    ): vscode.TextEdit[] {
        return this.formatRange(document, range, options);
    }

    private formatRange(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
    ): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('catapillar');
        const configIndent = config.get<number>('formatting.indentSize', 0);
        const indentSize = configIndent > 0 ? configIndent : (options.insertSpaces ? options.tabSize : 0);

        if (indentSize === 0) {
            // Indent-free mode: just clean up trailing whitespace and blank lines
            return this.cleanupWhitespace(document, range);
        }

        const indentStr = options.insertSpaces ? ' '.repeat(indentSize) : '\t';
        const edits: vscode.TextEdit[] = [];
        let indentLevel = 0;
        let inBlockComment = false;

        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = document.lineAt(i);
            const trimmed = line.text.trim();

            // Empty lines: preserve
            if (trimmed === '') { continue; }

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
            if (STRUCT_LOOKUP.has(firstWord)) {
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

    private cleanupWhitespace(
        document: vscode.TextDocument,
        range: vscode.Range,
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];

        for (let i = range.start.line; i <= range.end.line; i++) {
            const line = document.lineAt(i);
            const trimmedRight = line.text.trimEnd();

            if (line.text !== trimmedRight) {
                edits.push(vscode.TextEdit.replace(line.range, trimmedRight));
            }
        }

        return edits;
    }

    private getFirstWord(trimmed: string): string {
        const parts = trimmed.split(/\s+/);
        let idx = 0;
        if (parts.length > 0 && LINE_STATE_SET.has(parts[0])) {
            idx = 1;
        }
        return parts[idx] || '';
    }

    private getActionWord(trimmed: string): string | null {
        const parts = trimmed.split(/\s+/);
        let idx = 0;
        if (parts.length > 0 && LINE_STATE_SET.has(parts[0])) {
            idx = 1;
        }
        const word = parts[idx];
        if (!word) { return null; }
        return word.replace(/:$/, '');
    }

    private isBlockOpener(actionWord: string, fullLine: string): boolean {
        // Block openers must either be known block-opening keywords
        // or the line must end with ':'
        if (BLOCK_OPENERS.has(actionWord)) {
            return fullLine.trimEnd().endsWith(':');
        }
        // Named blocks (e.g. flow definitions) also end with ':'
        if (fullLine.trimEnd().endsWith(':') && !STRUCT_LOOKUP.has(actionWord)) {
            return ACTION_LOOKUP.has(actionWord) || !STRUCT_LOOKUP.has(actionWord);
        }
        return false;
    }
}
