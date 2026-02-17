/**
 * Document symbol provider — supplies the outline view and
 * go-to-symbol functionality for Catapillar files.
 */

import * as vscode from 'vscode';
import { parseSource, getFunctionSymbols, getVariableSymbols } from './parser';

export class CatapillarDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    provideDocumentSymbols(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken,
    ): vscode.DocumentSymbol[] {
        const source = document.getText();
        const result = parseSource(source);
        const symbols: vscode.DocumentSymbol[] = [];

        // Function definitions
        for (const sym of getFunctionSymbols(result)) {
            const line = Math.max(0, sym.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const range = docLine.range;

            const paramStr = sym.params && sym.params.length > 0
                ? `(${sym.params.join(', ')})`
                : '()';

            const ds = new vscode.DocumentSymbol(
                sym.name,
                paramStr,
                vscode.SymbolKind.Function,
                range,
                range,
            );
            symbols.push(ds);
        }

        // Variable assignments (deduplicated, show first occurrence)
        const seenVars = new Set<string>();
        for (const sym of getVariableSymbols(result)) {
            if (seenVars.has(sym.name)) { continue; }
            seenVars.add(sym.name);

            const line = Math.max(0, sym.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const range = docLine.range;

            const ds = new vscode.DocumentSymbol(
                sym.name,
                'variable',
                vscode.SymbolKind.Variable,
                range,
                range,
            );
            symbols.push(ds);
        }

        return symbols;
    }
}

/**
 * Definition provider — go-to-definition for function calls (调/call)
 * and variable references.
 */
export class CatapillarDefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
    ): vscode.Definition | undefined {

        const wordRange = document.getWordRangeAtPosition(
            position,
            /[\w\u4e00-\u9fff]+/,
        );
        if (!wordRange) { return undefined; }

        const word = document.getText(wordRange);
        const source = document.getText();
        const result = parseSource(source);

        // Look for function definition
        for (const sym of getFunctionSymbols(result)) {
            if (sym.name === word) {
                const line = Math.max(0, sym.lineno - 1);
                return new vscode.Location(
                    document.uri,
                    new vscode.Position(line, 0),
                );
            }
        }

        // Look for first variable assignment
        for (const sym of getVariableSymbols(result)) {
            if (sym.name === word) {
                const line = Math.max(0, sym.lineno - 1);
                return new vscode.Location(
                    document.uri,
                    new vscode.Position(line, 0),
                );
            }
        }

        return undefined;
    }
}

/**
 * Reference provider — find all references to a symbol.
 */
export class CatapillarReferenceProvider implements vscode.ReferenceProvider {

    provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.ReferenceContext,
        _token: vscode.CancellationToken,
    ): vscode.Location[] {
        const wordRange = document.getWordRangeAtPosition(
            position,
            /[\w\u4e00-\u9fff]+/,
        );
        if (!wordRange) { return []; }

        const word = document.getText(wordRange);
        const locations: vscode.Location[] = [];

        // Scan all lines for occurrences of the word
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            let startIdx = 0;

            while (true) {
                const idx = lineText.indexOf(word, startIdx);
                if (idx < 0) { break; }

                // Ensure it's a whole word match
                const before = idx > 0 ? lineText[idx - 1] : ' ';
                const after = idx + word.length < lineText.length
                    ? lineText[idx + word.length] : ' ';
                const wordBoundary = /[\s:,#]|^$/;

                if (wordBoundary.test(before) && wordBoundary.test(after)) {
                    locations.push(new vscode.Location(
                        document.uri,
                        new vscode.Range(
                            new vscode.Position(i, idx),
                            new vscode.Position(i, idx + word.length),
                        ),
                    ));
                }

                startIdx = idx + word.length;
            }
        }

        return locations;
    }
}
