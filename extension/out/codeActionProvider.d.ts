/**
 * Code action provider — refactoring support for Catapillar files.
 * Supports:
 *   - Extract Variable: wrap selected expression in a 置 (SET) statement
 *   - Extract Function: wrap selected lines in a 定 (DEF) block
 */
import * as vscode from 'vscode';
export declare class CatapillarCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, _context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.CodeAction[];
    private createExtractVariable;
    private createExtractFunction;
    private findFunctionInsertPosition;
}
//# sourceMappingURL=codeActionProvider.d.ts.map