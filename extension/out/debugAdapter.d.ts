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
export declare class CatapillarDebugConfigProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, _token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration>;
}
export declare class CatapillarDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
    constructor(extensionPath?: string);
    createDebugAdapterDescriptor(_session: vscode.DebugSession, _executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor>;
}
//# sourceMappingURL=debugAdapter.d.ts.map