/**
 * Document symbol provider — supplies the outline view and
 * go-to-symbol functionality for Catapillar files.
 */
import * as vscode from 'vscode';
export declare class CatapillarDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.DocumentSymbol[];
}
/**
 * Definition provider — go-to-definition for function calls (调/call)
 * and variable references.
 */
export declare class CatapillarDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.Definition | undefined;
}
/**
 * Reference provider — find all references to a symbol.
 */
export declare class CatapillarReferenceProvider implements vscode.ReferenceProvider {
    provideReferences(document: vscode.TextDocument, position: vscode.Position, _context: vscode.ReferenceContext, _token: vscode.CancellationToken): vscode.Location[];
}
//# sourceMappingURL=documentSymbolProvider.d.ts.map