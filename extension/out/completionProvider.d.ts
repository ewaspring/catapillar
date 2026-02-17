/**
 * Completion provider — offers keyword auto-completion and
 * symbol-based completion for Catapillar files.
 */
import * as vscode from 'vscode';
export declare class CatapillarCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, _context: vscode.CompletionContext): vscode.CompletionItem[];
    private getCurrentWord;
    private createKeywordItems;
    private getSymbolCompletions;
}
//# sourceMappingURL=completionProvider.d.ts.map