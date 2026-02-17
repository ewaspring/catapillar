"use strict";
/**
 * Document symbol provider — supplies the outline view and
 * go-to-symbol functionality for Catapillar files.
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
exports.CatapillarReferenceProvider = exports.CatapillarDefinitionProvider = exports.CatapillarDocumentSymbolProvider = void 0;
const vscode = __importStar(require("vscode"));
const parser_1 = require("./parser");
class CatapillarDocumentSymbolProvider {
    provideDocumentSymbols(document, _token) {
        const source = document.getText();
        const result = (0, parser_1.parseSource)(source);
        const symbols = [];
        // Function definitions
        for (const sym of (0, parser_1.getFunctionSymbols)(result)) {
            const line = Math.max(0, sym.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const range = docLine.range;
            const paramStr = sym.params && sym.params.length > 0
                ? `(${sym.params.join(', ')})`
                : '()';
            const ds = new vscode.DocumentSymbol(sym.name, paramStr, vscode.SymbolKind.Function, range, range);
            symbols.push(ds);
        }
        // Variable assignments (deduplicated, show first occurrence)
        const seenVars = new Set();
        for (const sym of (0, parser_1.getVariableSymbols)(result)) {
            if (seenVars.has(sym.name)) {
                continue;
            }
            seenVars.add(sym.name);
            const line = Math.max(0, sym.lineno - 1);
            const docLine = document.lineAt(Math.min(line, document.lineCount - 1));
            const range = docLine.range;
            const ds = new vscode.DocumentSymbol(sym.name, 'variable', vscode.SymbolKind.Variable, range, range);
            symbols.push(ds);
        }
        return symbols;
    }
}
exports.CatapillarDocumentSymbolProvider = CatapillarDocumentSymbolProvider;
/**
 * Definition provider — go-to-definition for function calls (调/call)
 * and variable references.
 */
class CatapillarDefinitionProvider {
    provideDefinition(document, position, _token) {
        const wordRange = document.getWordRangeAtPosition(position, /[\w\u4e00-\u9fff]+/);
        if (!wordRange) {
            return undefined;
        }
        const word = document.getText(wordRange);
        const source = document.getText();
        const result = (0, parser_1.parseSource)(source);
        // Look for function definition
        for (const sym of (0, parser_1.getFunctionSymbols)(result)) {
            if (sym.name === word) {
                const line = Math.max(0, sym.lineno - 1);
                return new vscode.Location(document.uri, new vscode.Position(line, 0));
            }
        }
        // Look for first variable assignment
        for (const sym of (0, parser_1.getVariableSymbols)(result)) {
            if (sym.name === word) {
                const line = Math.max(0, sym.lineno - 1);
                return new vscode.Location(document.uri, new vscode.Position(line, 0));
            }
        }
        return undefined;
    }
}
exports.CatapillarDefinitionProvider = CatapillarDefinitionProvider;
/**
 * Reference provider — find all references to a symbol.
 */
class CatapillarReferenceProvider {
    provideReferences(document, position, _context, _token) {
        const wordRange = document.getWordRangeAtPosition(position, /[\w\u4e00-\u9fff]+/);
        if (!wordRange) {
            return [];
        }
        const word = document.getText(wordRange);
        const locations = [];
        // Scan all lines for occurrences of the word
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            let startIdx = 0;
            while (true) {
                const idx = lineText.indexOf(word, startIdx);
                if (idx < 0) {
                    break;
                }
                // Ensure it's a whole word match
                const before = idx > 0 ? lineText[idx - 1] : ' ';
                const after = idx + word.length < lineText.length
                    ? lineText[idx + word.length] : ' ';
                const wordBoundary = /[\s:,#]|^$/;
                if (wordBoundary.test(before) && wordBoundary.test(after)) {
                    locations.push(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(i, idx), new vscode.Position(i, idx + word.length))));
                }
                startIdx = idx + word.length;
            }
        }
        return locations;
    }
}
exports.CatapillarReferenceProvider = CatapillarReferenceProvider;
//# sourceMappingURL=documentSymbolProvider.js.map