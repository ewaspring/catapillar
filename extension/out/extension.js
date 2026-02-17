"use strict";
/**
 * Catapillar VS Code Extension — main entry point.
 *
 * Registers all language features:
 *   - Diagnostics (syntax checking)
 *   - Completion (IntelliSense)
 *   - Hover (keyword documentation)
 *   - Document symbols (outline, breadcrumbs)
 *   - Definition & References (code navigation)
 *   - Formatting (code formatting)
 *   - Code actions (refactoring)
 *   - Debug adapter (run/debug)
 *   - Commands (run, transpile, show AST)
 *   - Code Lens (Run button next to "As main:" / "定 main:", like Python's run next to if __name__)
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const diagnosticsManager_1 = require("./diagnosticsManager");
const completionProvider_1 = require("./completionProvider");
const hoverProvider_1 = require("./hoverProvider");
const documentSymbolProvider_1 = require("./documentSymbolProvider");
const formattingProvider_1 = require("./formattingProvider");
const codeActionProvider_1 = require("./codeActionProvider");
const debugAdapter_1 = require("./debugAdapter");
const LANGUAGE_ID = 'catapillar';
/** Set in activate: root of the bundled Catapillar runtime (extension/catapillar-runtime). */
let bundledRuntimeRoot;
function activate(context) {
    bundledRuntimeRoot = path.join(context.extensionPath, 'catapillar-runtime');
    const outputChannel = vscode.window.createOutputChannel('Catapillar');
    outputChannel.appendLine('Catapillar extension activating...');
    // --- Diagnostics ---
    const diagnostics = new diagnosticsManager_1.DiagnosticsManager();
    context.subscriptions.push(diagnostics);
    // --- Completion ---
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(LANGUAGE_ID, new completionProvider_1.CatapillarCompletionProvider(), '~', '>', '<', '!', '?'));
    // --- Hover ---
    context.subscriptions.push(vscode.languages.registerHoverProvider(LANGUAGE_ID, new hoverProvider_1.CatapillarHoverProvider()));
    // --- Document Symbols (Outline) ---
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(LANGUAGE_ID, new documentSymbolProvider_1.CatapillarDocumentSymbolProvider()));
    // --- Go to Definition ---
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(LANGUAGE_ID, new documentSymbolProvider_1.CatapillarDefinitionProvider()));
    // --- Find References ---
    context.subscriptions.push(vscode.languages.registerReferenceProvider(LANGUAGE_ID, new documentSymbolProvider_1.CatapillarReferenceProvider()));
    // --- Formatting ---
    const formattingProvider = new formattingProvider_1.CatapillarFormattingProvider();
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(LANGUAGE_ID, formattingProvider), vscode.languages.registerDocumentRangeFormattingEditProvider(LANGUAGE_ID, formattingProvider));
    // --- Refactoring (Code Actions) ---
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(LANGUAGE_ID, new codeActionProvider_1.CatapillarCodeActionProvider(), {
        providedCodeActionKinds: codeActionProvider_1.CatapillarCodeActionProvider.providedCodeActionKinds,
    }));
    // --- Debug Adapter ---
    const debugConfigProvider = new debugAdapter_1.CatapillarDebugConfigProvider();
    const debugAdapterFactory = new debugAdapter_1.CatapillarDebugAdapterFactory(context.extensionPath);
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(LANGUAGE_ID, debugConfigProvider), vscode.debug.registerDebugAdapterDescriptorFactory(LANGUAGE_ID, debugAdapterFactory));
    // --- Code Lens: "Run" next to main entry (As main: / 定 main:) ---
    context.subscriptions.push(vscode.languages.registerCodeLensProvider(LANGUAGE_ID, new CatapillarRunCodeLensProvider()));
    // --- Commands ---
    context.subscriptions.push(vscode.commands.registerCommand('catapillar.run', () => {
        runCatapillarFileInTerminal();
    }), vscode.commands.registerCommand('catapillar.runInTerminal', () => {
        runCatapillarFileInTerminal();
    }), vscode.commands.registerCommand('catapillar.runCodeLens', (uri) => {
        runDocumentInTerminal(uri);
    }), vscode.commands.registerCommand('catapillar.transpileToPython', () => {
        runCatapillarFile(outputChannel, '--mode=python');
    }), vscode.commands.registerCommand('catapillar.showAst', () => {
        showAst(outputChannel);
    }));
    outputChannel.appendLine('Catapillar extension activated.');
}
function deactivate() {
    // Cleanup handled by disposables
}
// =====================================================
// Code Lens: Run button next to main entry (e.g. "As main:" or "定 main:")
// =====================================================
/** Match line that defines main entry: 定 main:, As main:, or def main: */
const MAIN_ENTRY_REGEX = /^\s*(定|As|def)\s+main\s*:/i;
function findMainEntryLine(document) {
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        const trimmed = line.trim();
        // Ignore lines that are only comments
        if (trimmed.startsWith('#'))
            continue;
        if (MAIN_ENTRY_REGEX.test(trimmed)) {
            return i;
        }
    }
    return -1;
}
class CatapillarRunCodeLensProvider {
    provideCodeLenses(document, _token) {
        const runCommand = {
            title: '$(play) Run',
            command: 'catapillar.runCodeLens',
            arguments: [document.uri.fsPath],
        };
        const mainLine = findMainEntryLine(document);
        if (mainLine >= 0) {
            const range = new vscode.Range(mainLine, 0, mainLine, 0);
            return [new vscode.CodeLens(range, runCommand)];
        }
        // No "As main:" / "定 main:" — show Run at top of file
        const top = new vscode.Range(0, 0, 0, 0);
        return [new vscode.CodeLens(top, runCommand)];
    }
}
// =====================================================
// Command Implementations
// =====================================================
function getCatapillarPaths() {
    const config = vscode.workspace.getConfiguration('catapillar');
    const pythonPath = config.get('pythonPath', 'python');
    // 1) Explicit project root (external repo)
    let root = config.get('projectRoot', '');
    // 2) Bundled runtime (extension/catapillar-runtime) — works with no repo
    if (!root && bundledRuntimeRoot) {
        const fs = require('fs');
        if (fs.existsSync(path.join(bundledRuntimeRoot, 'tools', 'catapillar.py'))) {
            root = bundledRuntimeRoot;
        }
    }
    // 3) Workspace folder as fallback (e.g. development)
    if (!root) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            root = workspaceFolders[0].uri.fsPath;
        }
    }
    if (!root) {
        vscode.window.showErrorMessage('Cannot determine Catapillar runtime. Open a folder or set catapillar.projectRoot. The extension ships a bundled runtime when installed from VSIX.');
        return null;
    }
    const toolsPath = path.join(root, 'tools', 'catapillar.py');
    return { pythonPath, toolsPath, cwd: root };
}
function runCatapillarFile(outputChannel, ...extraArgs) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
        vscode.window.showWarningMessage('No active Catapillar file.');
        return;
    }
    // Save file before running
    editor.document.save().then(() => {
        const paths = getCatapillarPaths();
        if (!paths) {
            return;
        }
        const filePath = editor.document.uri.fsPath;
        const args = [paths.toolsPath, filePath, ...extraArgs].join(' ');
        const cmd = `${paths.pythonPath} ${args}`;
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`> ${cmd}\n`);
        (0, child_process_1.exec)(cmd, { cwd: paths.cwd }, (error, stdout, stderr) => {
            if (stdout) {
                outputChannel.appendLine(stdout);
            }
            if (stderr) {
                outputChannel.appendLine(`[stderr] ${stderr}`);
            }
            if (error) {
                outputChannel.appendLine(`[error] Exit code: ${error.code}`);
            }
        });
    });
}
function runCatapillarFileInTerminal() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
        vscode.window.showWarningMessage('No active Catapillar file.');
        return;
    }
    editor.document.save().then(() => {
        runDocumentInTerminal(editor.document.uri.fsPath);
    });
}
function runDocumentInTerminal(filePath) {
    const paths = getCatapillarPaths();
    if (!paths) {
        return;
    }
    const quotedPath = filePath.includes(' ') ? `"${filePath}"` : filePath;
    const quotedTools = paths.toolsPath.includes(' ') ? `"${paths.toolsPath}"` : paths.toolsPath;
    const cmd = `${paths.pythonPath} ${quotedTools} ${quotedPath} --exec`;
    const terminal = vscode.window.createTerminal({
        name: 'Catapillar',
        cwd: paths.cwd,
    });
    terminal.show();
    terminal.sendText(cmd);
}
function showAst(outputChannel) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
        vscode.window.showWarningMessage('No active Catapillar file.');
        return;
    }
    // Use the built-in TS parser to show AST
    const { parseSource } = require('./parser');
    const source = editor.document.getText();
    const result = parseSource(source);
    const astJson = JSON.stringify(result.program, null, 2);
    // Open in a new untitled document
    vscode.workspace.openTextDocument({
        content: astJson,
        language: 'json',
    }).then(doc => {
        vscode.window.showTextDocument(doc, { preview: true });
    });
}
//# sourceMappingURL=extension.js.map