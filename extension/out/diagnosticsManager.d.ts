/**
 * Diagnostics manager — runs the Catapillar parser on open documents
 * and publishes parse errors / warnings as VS Code diagnostics.
 */
import * as vscode from 'vscode';
export declare class DiagnosticsManager implements vscode.Disposable {
    private collection;
    private disposables;
    constructor();
    analyze(document: vscode.TextDocument): void;
    dispose(): void;
}
//# sourceMappingURL=diagnosticsManager.d.ts.map