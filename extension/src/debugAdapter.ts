/**
 * Debug adapter for Catapillar — supports running and debugging .cat files.
 *
 * The adapter works by:
 * 1. Spawning the Catapillar CLI (tools/catapillar.py) to run the file
 * 2. Capturing stdout/stderr and forwarding to the Debug Console
 * 3. Supporting basic run/stop lifecycle
 *
 * For full Python-level debugging, it can transpile to Python and delegate
 * to debugpy (when mode is "python").
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, spawn } from 'child_process';

/** Root of the bundled Catapillar runtime (extension/catapillar-runtime). Set by factory. */
let bundledRuntimeRoot: string | undefined;

// =====================================================
// Debug Configuration Provider
// =====================================================

export class CatapillarDebugConfigProvider implements vscode.DebugConfigurationProvider {

    resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        _token?: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.DebugConfiguration> {

        // If launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'catapillar') {
                config.type = 'catapillar';
                config.name = 'Run Catapillar File';
                config.request = 'launch';
                config.program = '${file}';
                config.mode = 'auto';
            }
        }

        if (!config.program) {
            return vscode.window.showInformationMessage(
                'Cannot find a .cat file to run',
            ).then(_ => undefined);
        }

        // Resolve catapillar root: config > bundled runtime > workspace folder
        if (!config.catapillarRoot) {
            const wsConfig = vscode.workspace.getConfiguration('catapillar');
            config.catapillarRoot = wsConfig.get<string>('projectRoot', '');

            if (!config.catapillarRoot && bundledRuntimeRoot) {
                const toolsPath = path.join(bundledRuntimeRoot, 'tools', 'catapillar.py');
                if (fs.existsSync(toolsPath)) {
                    config.catapillarRoot = bundledRuntimeRoot;
                }
            }
            if (!config.catapillarRoot && folder) {
                config.catapillarRoot = folder.uri.fsPath;
            }
        }

        // Resolve python path
        if (!config.pythonPath) {
            const wsConfig = vscode.workspace.getConfiguration('catapillar');
            config.pythonPath = wsConfig.get<string>('pythonPath', 'python');
        }

        return config;
    }
}

// =====================================================
// Debug Adapter Factory
// =====================================================

export class CatapillarDebugAdapterFactory
    implements vscode.DebugAdapterDescriptorFactory {

    constructor(extensionPath?: string) {
        if (extensionPath) {
            bundledRuntimeRoot = path.join(extensionPath, 'catapillar-runtime');
        }
    }

    createDebugAdapterDescriptor(
        _session: vscode.DebugSession,
        _executable: vscode.DebugAdapterExecutable | undefined,
    ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        return new vscode.DebugAdapterInlineImplementation(
            new CatapillarDebugAdapter(),
        );
    }
}

// =====================================================
// Inline Debug Adapter (DAP)
// =====================================================

interface DAPMessage {
    seq: number;
    type: string;
}

interface DAPRequest extends DAPMessage {
    type: 'request';
    command: string;
    arguments?: Record<string, unknown>;
}

interface DAPResponse extends DAPMessage {
    type: 'response';
    request_seq: number;
    success: boolean;
    command: string;
    message?: string;
    body?: Record<string, unknown>;
}

interface DAPEvent extends DAPMessage {
    type: 'event';
    event: string;
    body?: Record<string, unknown>;
}

class CatapillarDebugAdapter implements vscode.DebugAdapter {

    private sendMessageEmitter = new vscode.EventEmitter<DAPResponse | DAPEvent>();
    readonly onDidSendMessage: vscode.Event<DAPResponse | DAPEvent> = this.sendMessageEmitter.event;

    private seq = 1;
    private childProcess: ChildProcess | null = null;

    handleMessage(message: DAPMessage): void {
        if (message.type === 'request') {
            this.handleRequest(message as DAPRequest);
        }
    }

    private handleRequest(request: DAPRequest): void {
        switch (request.command) {
            case 'initialize':
                this.onInitialize(request);
                break;
            case 'launch':
                this.onLaunch(request);
                break;
            case 'disconnect':
                this.onDisconnect(request);
                break;
            case 'threads':
                this.sendResponse(request, { threads: [{ id: 1, name: 'main' }] });
                break;
            case 'configurationDone':
                this.sendResponse(request);
                break;
            default:
                this.sendResponse(request, undefined, `Unsupported command: ${request.command}`);
                break;
        }
    }

    private onInitialize(request: DAPRequest): void {
        this.sendResponse(request, {
            supportsConfigurationDoneRequest: true,
            supportTerminateDebuggee: true,
        });

        this.sendEvent('initialized');
    }

    private onLaunch(request: DAPRequest): void {
        const args = request.arguments as {
            program?: string;
            mode?: string;
            pythonPath?: string;
            catapillarRoot?: string;
        } | undefined;

        if (!args?.program) {
            this.sendResponse(request, undefined, 'No program specified');
            return;
        }

        const program = args.program;
        const mode = args.mode || 'auto';
        const pythonPath = args.pythonPath || 'python';
        const catapillarRoot = args.catapillarRoot || '';

        // Find tools/catapillar.py relative to catapillarRoot or program
        const toolsPath = catapillarRoot
            ? path.join(catapillarRoot, 'tools', 'catapillar.py')
            : path.join(path.dirname(program), '..', 'tools', 'catapillar.py');

        const cliArgs = [toolsPath, program, `--mode=${mode}`, '--exec'];

        this.sendEvent('output', {
            category: 'console',
            output: `Running: ${pythonPath} ${cliArgs.join(' ')}\n`,
        });

        this.sendResponse(request);

        // Spawn the process
        const cwd = catapillarRoot || path.dirname(program);

        try {
            this.childProcess = spawn(pythonPath, cliArgs, {
                cwd,
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            this.childProcess.stdout?.on('data', (data: Buffer) => {
                this.sendEvent('output', {
                    category: 'stdout',
                    output: data.toString(),
                });
            });

            this.childProcess.stderr?.on('data', (data: Buffer) => {
                this.sendEvent('output', {
                    category: 'stderr',
                    output: data.toString(),
                });
            });

            this.childProcess.on('close', (code: number | null) => {
                this.sendEvent('output', {
                    category: 'console',
                    output: `\nProcess exited with code ${code ?? 'unknown'}\n`,
                });
                this.sendEvent('terminated');
            });

            this.childProcess.on('error', (err: Error) => {
                this.sendEvent('output', {
                    category: 'stderr',
                    output: `Failed to start process: ${err.message}\n`,
                });
                this.sendEvent('terminated');
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.sendEvent('output', {
                category: 'stderr',
                output: `Error: ${errorMessage}\n`,
            });
            this.sendEvent('terminated');
        }
    }

    private onDisconnect(request: DAPRequest): void {
        if (this.childProcess) {
            this.childProcess.kill('SIGTERM');
            this.childProcess = null;
        }
        this.sendResponse(request);
    }

    private sendResponse(
        request: DAPRequest,
        body?: Record<string, unknown>,
        errorMessage?: string,
    ): void {
        const response: DAPResponse = {
            seq: this.seq++,
            type: 'response',
            request_seq: request.seq,
            success: !errorMessage,
            command: request.command,
            body,
        };
        if (errorMessage) {
            response.message = errorMessage;
        }
        this.sendMessageEmitter.fire(response);
    }

    private sendEvent(event: string, body?: Record<string, unknown>): void {
        const evt: DAPEvent = {
            seq: this.seq++,
            type: 'event',
            event,
            body,
        };
        this.sendMessageEmitter.fire(evt);
    }

    dispose(): void {
        if (this.childProcess) {
            this.childProcess.kill('SIGTERM');
            this.childProcess = null;
        }
        this.sendMessageEmitter.dispose();
    }
}
