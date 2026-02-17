"use strict";
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
exports.CatapillarDebugAdapterFactory = exports.CatapillarDebugConfigProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
/** Root of the bundled Catapillar runtime (extension/catapillar-runtime). Set by factory. */
let bundledRuntimeRoot;
// =====================================================
// Debug Configuration Provider
// =====================================================
class CatapillarDebugConfigProvider {
    resolveDebugConfiguration(folder, config, _token) {
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
            return vscode.window.showInformationMessage('Cannot find a .cat file to run').then(_ => undefined);
        }
        // Resolve catapillar root: config > bundled runtime > workspace folder
        if (!config.catapillarRoot) {
            const wsConfig = vscode.workspace.getConfiguration('catapillar');
            config.catapillarRoot = wsConfig.get('projectRoot', '');
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
            config.pythonPath = wsConfig.get('pythonPath', 'python');
        }
        return config;
    }
}
exports.CatapillarDebugConfigProvider = CatapillarDebugConfigProvider;
// =====================================================
// Debug Adapter Factory
// =====================================================
class CatapillarDebugAdapterFactory {
    constructor(extensionPath) {
        if (extensionPath) {
            bundledRuntimeRoot = path.join(extensionPath, 'catapillar-runtime');
        }
    }
    createDebugAdapterDescriptor(_session, _executable) {
        return new vscode.DebugAdapterInlineImplementation(new CatapillarDebugAdapter());
    }
}
exports.CatapillarDebugAdapterFactory = CatapillarDebugAdapterFactory;
class CatapillarDebugAdapter {
    constructor() {
        this.sendMessageEmitter = new vscode.EventEmitter();
        this.onDidSendMessage = this.sendMessageEmitter.event;
        this.seq = 1;
        this.childProcess = null;
    }
    handleMessage(message) {
        if (message.type === 'request') {
            this.handleRequest(message);
        }
    }
    handleRequest(request) {
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
    onInitialize(request) {
        this.sendResponse(request, {
            supportsConfigurationDoneRequest: true,
            supportTerminateDebuggee: true,
        });
        this.sendEvent('initialized');
    }
    onLaunch(request) {
        const args = request.arguments;
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
            this.childProcess = (0, child_process_1.spawn)(pythonPath, cliArgs, {
                cwd,
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            this.childProcess.stdout?.on('data', (data) => {
                this.sendEvent('output', {
                    category: 'stdout',
                    output: data.toString(),
                });
            });
            this.childProcess.stderr?.on('data', (data) => {
                this.sendEvent('output', {
                    category: 'stderr',
                    output: data.toString(),
                });
            });
            this.childProcess.on('close', (code) => {
                this.sendEvent('output', {
                    category: 'console',
                    output: `\nProcess exited with code ${code ?? 'unknown'}\n`,
                });
                this.sendEvent('terminated');
            });
            this.childProcess.on('error', (err) => {
                this.sendEvent('output', {
                    category: 'stderr',
                    output: `Failed to start process: ${err.message}\n`,
                });
                this.sendEvent('terminated');
            });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.sendEvent('output', {
                category: 'stderr',
                output: `Error: ${errorMessage}\n`,
            });
            this.sendEvent('terminated');
        }
    }
    onDisconnect(request) {
        if (this.childProcess) {
            this.childProcess.kill('SIGTERM');
            this.childProcess = null;
        }
        this.sendResponse(request);
    }
    sendResponse(request, body, errorMessage) {
        const response = {
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
    sendEvent(event, body) {
        const evt = {
            seq: this.seq++,
            type: 'event',
            event,
            body,
        };
        this.sendMessageEmitter.fire(evt);
    }
    dispose() {
        if (this.childProcess) {
            this.childProcess.kill('SIGTERM');
            this.childProcess = null;
        }
        this.sendMessageEmitter.dispose();
    }
}
//# sourceMappingURL=debugAdapter.js.map