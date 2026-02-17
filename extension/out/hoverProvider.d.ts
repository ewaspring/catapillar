/**
 * Hover provider — shows keyword documentation and symbol info
 * when hovering over tokens in a Catapillar file.
 */
import * as vscode from 'vscode';
export declare class CatapillarHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.Hover | undefined;
    private buildKeywordHover;
    private getLineStateHover;
    private getSymbolHover;
}
//# sourceMappingURL=hoverProvider.d.ts.map