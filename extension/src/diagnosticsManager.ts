/**
 * Diagnostics manager — runs the Catapillar parser on open documents
 * and publishes parse errors / warnings as VS Code diagnostics.
 */

import * as vscode from 'vscode';
import { parseSource } from './parser';

const DIAGNOSTIC_SOURCE = 'catapillar';

export class DiagnosticsManager implements vscode.Disposable {
    private collection: vscode.DiagnosticCollection;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.collection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);

        // Re-analyze on document open/change/save
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(doc => this.analyze(doc)),
            vscode.workspace.onDidChangeTextDocument(e => this.analyze(e.document)),
            vscode.workspace.onDidCloseTextDocument(doc => this.collection.delete(doc.uri)),
        );

        // Analyze all currently open .cat files
        for (const doc of vscode.workspace.textDocuments) {
            this.analyze(doc);
        }
    }

    analyze(document: vscode.TextDocument): void {
        if (document.languageId !== 'catapillar') { return; }

        const config = vscode.workspace.getConfiguration('catapillar');
        if (!config.get<boolean>('diagnostics.enable', true)) {
            this.collection.delete(document.uri);
            return;
        }

        const source = document.getText();
        const { diagnostics } = parseSource(source);

        const vsDiagnostics: vscode.Diagnostic[] = diagnostics.map(d => {
            const line = Math.max(0, d.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const startCol = d.colStart ?? 0;
            const endCol = d.colEnd ?? docLine.text.length;

            const range = new vscode.Range(
                new vscode.Position(line, startCol),
                new vscode.Position(line, endCol),
            );

            const severity = d.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;

            const diag = new vscode.Diagnostic(range, d.message, severity);
            diag.source = DIAGNOSTIC_SOURCE;
            return diag;
        });

        this.collection.set(document.uri, vsDiagnostics);
    }

    dispose(): void {
        this.collection.dispose();
        for (const d of this.disposables) { d.dispose(); }
    }
}
