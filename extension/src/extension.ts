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

import * as vscode from 'vscode';
import * as path from 'path';
import { exec } from 'child_process';

import { DiagnosticsManager } from './diagnosticsManager';
import { CatapillarCompletionProvider } from './completionProvider';
import { CatapillarHoverProvider } from './hoverProvider';
import {
    CatapillarDocumentSymbolProvider,
    CatapillarDefinitionProvider,
    CatapillarReferenceProvider,
} from './documentSymbolProvider';
import { CatapillarFormattingProvider } from './formattingProvider';
import { CatapillarCodeActionProvider } from './codeActionProvider';
import {
    CatapillarDebugConfigProvider,
    CatapillarDebugAdapterFactory,
} from './debugAdapter';

const LANGUAGE_ID = 'catapillar';

/** Set in activate: root of the bundled Catapillar runtime (extension/catapillar-runtime). */
let bundledRuntimeRoot: string | undefined;

export function activate(context: vscode.ExtensionContext): void {
    bundledRuntimeRoot = path.join(context.extensionPath, 'catapillar-runtime');

    const outputChannel = vscode.window.createOutputChannel('Catapillar');

    outputChannel.appendLine('Catapillar extension activating...');

    // --- Diagnostics ---
    const diagnostics = new DiagnosticsManager();
    context.subscriptions.push(diagnostics);

    // --- Completion ---
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            LANGUAGE_ID,
            new CatapillarCompletionProvider(),
            '~', '>', '<', '!', '?', // Trigger on line states
        ),
    );

    // --- Hover ---
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            LANGUAGE_ID,
            new CatapillarHoverProvider(),
        ),
    );

    // --- Document Symbols (Outline) ---
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            LANGUAGE_ID,
            new CatapillarDocumentSymbolProvider(),
        ),
    );

    // --- Go to Definition ---
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            LANGUAGE_ID,
            new CatapillarDefinitionProvider(),
        ),
    );

    // --- Find References ---
    context.subscriptions.push(
        vscode.languages.registerReferenceProvider(
            LANGUAGE_ID,
            new CatapillarReferenceProvider(),
        ),
    );

    // --- Formatting ---
    const formattingProvider = new CatapillarFormattingProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            LANGUAGE_ID,
            formattingProvider,
        ),
        vscode.languages.registerDocumentRangeFormattingEditProvider(
            LANGUAGE_ID,
            formattingProvider,
        ),
    );

    // --- Refactoring (Code Actions) ---
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            LANGUAGE_ID,
            new CatapillarCodeActionProvider(),
            {
                providedCodeActionKinds: CatapillarCodeActionProvider.providedCodeActionKinds,
            },
        ),
    );

    // --- Debug Adapter ---
    const debugConfigProvider = new CatapillarDebugConfigProvider();
    const debugAdapterFactory = new CatapillarDebugAdapterFactory(context.extensionPath);

    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider(
            LANGUAGE_ID,
            debugConfigProvider,
        ),
        vscode.debug.registerDebugAdapterDescriptorFactory(
            LANGUAGE_ID,
            debugAdapterFactory,
        ),
    );

    // --- Code Lens: "Run" next to main entry (As main: / 定 main:) ---
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            LANGUAGE_ID,
            new CatapillarRunCodeLensProvider(),
        ),
    );

    // --- Commands ---
    context.subscriptions.push(
        vscode.commands.registerCommand('catapillar.run', () => {
            runCatapillarFileInTerminal();
        }),
        vscode.commands.registerCommand('catapillar.runInTerminal', () => {
            runCatapillarFileInTerminal();
        }),
        vscode.commands.registerCommand('catapillar.runCodeLens', (uri: string) => {
            runDocumentInTerminal(uri);
        }),
        vscode.commands.registerCommand('catapillar.transpileToPython', () => {
            runCatapillarFile(outputChannel, '--mode=python');
        }),
        vscode.commands.registerCommand('catapillar.showAst', () => {
            showAst(outputChannel);
        }),
    );

    outputChannel.appendLine('Catapillar extension activated.');
}

export function deactivate(): void {
    // Cleanup handled by disposables
}

// =====================================================
// Code Lens: Run button next to main entry (e.g. "As main:" or "定 main:")
// =====================================================

/** Match line that defines main entry: 定 main:, As main:, or def main: */
const MAIN_ENTRY_REGEX = /^\s*(定|As|def)\s+main\s*:/i;

function findMainEntryLine(document: vscode.TextDocument): number {
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        const trimmed = line.trim();
        // Ignore lines that are only comments
        if (trimmed.startsWith('#')) continue;
        if (MAIN_ENTRY_REGEX.test(trimmed)) {
            return i;
        }
    }
    return -1;
}

class CatapillarRunCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken,
    ): vscode.CodeLens[] {
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

function getCatapillarPaths(): { pythonPath: string; toolsPath: string; cwd: string } | null {
    const config = vscode.workspace.getConfiguration('catapillar');
    const pythonPath = config.get<string>('pythonPath', 'python');

    // 1) Explicit project root (external repo)
    let root = config.get<string>('projectRoot', '');
    // 2) Bundled runtime (extension/catapillar-runtime) — works with no repo
    if (!root && bundledRuntimeRoot) {
        const fs = require('fs') as typeof import('fs');
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
        vscode.window.showErrorMessage(
            'Cannot determine Catapillar runtime. Open a folder or set catapillar.projectRoot. The extension ships a bundled runtime when installed from VSIX.',
        );
        return null;
    }

    const toolsPath = path.join(root, 'tools', 'catapillar.py');
    return { pythonPath, toolsPath, cwd: root };
}

function runCatapillarFile(outputChannel: vscode.OutputChannel, ...extraArgs: string[]): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
        vscode.window.showWarningMessage('No active Catapillar file.');
        return;
    }

    // Save file before running
    editor.document.save().then(() => {
        const paths = getCatapillarPaths();
        if (!paths) { return; }

        const filePath = editor.document.uri.fsPath;
        const args = [paths.toolsPath, filePath, ...extraArgs].join(' ');
        const cmd = `${paths.pythonPath} ${args}`;

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`> ${cmd}\n`);

        exec(cmd, { cwd: paths.cwd }, (error, stdout, stderr) => {
            if (stdout) { outputChannel.appendLine(stdout); }
            if (stderr) { outputChannel.appendLine(`[stderr] ${stderr}`); }
            if (error) {
                outputChannel.appendLine(`[error] Exit code: ${error.code}`);
            }
        });
    });
}

function runCatapillarFileInTerminal(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
        vscode.window.showWarningMessage('No active Catapillar file.');
        return;
    }
    editor.document.save().then(() => {
        runDocumentInTerminal(editor.document.uri.fsPath);
    });
}

function runDocumentInTerminal(filePath: string): void {
    const paths = getCatapillarPaths();
    if (!paths) { return; }

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

function showAst(outputChannel: vscode.OutputChannel): void {
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
