"use strict";
/**
 * Diagnostics manager — runs the Catapillar parser on open documents
 * and publishes parse errors / warnings as VS Code diagnostics.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsManager = void 0;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
const DIAGNOSTIC_SOURCE = 'catapillar';
class DiagnosticsManager {
    constructor() {
        this.disposables = [];
        this.collection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
        // Re-analyze on document open/change/save
        this.disposables.push(vscode.workspace.onDidOpenTextDocument(doc => this.analyze(doc)), vscode.workspace.onDidChangeTextDocument(e => this.analyze(e.document)), vscode.workspace.onDidCloseTextDocument(doc => this.collection.delete(doc.uri)));
        // Analyze all currently open .cat files
        for (const doc of vscode.workspace.textDocuments) {
            this.analyze(doc);
        }
    }
    analyze(document) {
        if (document.languageId !== 'catapillar') {
            return;
        }
        const config = vscode.workspace.getConfiguration('catapillar');
        if (!config.get('diagnostics.enable', true)) {
            this.collection.delete(document.uri);
            return;
        }
        const source = document.getText();
        const { diagnostics } = (0, parser_1.parseSource)(source);
        const vsDiagnostics = diagnostics.map(d => {
            const line = Math.max(0, d.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const startCol = d.colStart ?? 0;
            const endCol = d.colEnd ?? docLine.text.length;
            const range = new vscode.Range(new vscode.Position(line, startCol), new vscode.Position(line, endCol));
            const severity = d.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;
            const diag = new vscode.Diagnostic(range, d.message, severity);
            diag.source = DIAGNOSTIC_SOURCE;
            return diag;
        });
        this.collection.set(document.uri, vsDiagnostics);
    }
    dispose() {
        this.collection.dispose();
        for (const d of this.disposables) {
            d.dispose();
        }
    }
}
exports.DiagnosticsManager = DiagnosticsManager;
//# sourceMappingURL=diagnosticsManager.js.map