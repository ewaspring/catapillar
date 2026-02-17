/**
 * Formatting provider — formats Catapillar source code with
 * consistent indentation based on block structure.
 *
 * Catapillar is indent-free by design, but optional indentation
 * can be applied for readability (controlled by settings).
 */
import * as vscode from 'vscode';
export declare class CatapillarFormattingProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, _token: vscode.CancellationToken): vscode.TextEdit[];
    provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, _token: vscode.CancellationToken): vscode.TextEdit[];
    private formatRange;
    private cleanupWhitespace;
    private getFirstWord;
    private getActionWord;
    private isBlockOpener;
}
//# sourceMappingURL=formattingProvider.d.ts.map