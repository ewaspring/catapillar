/**
 * Catapillar tokenizer — TypeScript port of parser/tokenizer.py.
 * Converts raw source text into a flat list of Token objects.
 */

import { LINE_STATE_SET } from './keywords';

export interface Token {
    rawAction: string;
    rawArgs: string[];
    lineState: string;
    lineno: number;
    colOffset: number;
    rawText: string;
}

export interface TokenizeWarning {
    message: string;
    lineno: number;
}

export interface TokenizeResult {
    tokens: Token[];
    warnings: TokenizeWarning[];
}

/**
 * Tokenize a single line of Catapillar source.
 */
export function tokenizeLine(line: string, lineno: number): Token | null {
    if (!line) { return null; }

    const stripped = line.trim();
    if (!stripped) { return null; }
    if (stripped.startsWith('#')) { return null; }

    const parts = stripped.split(/\s+/);
    let lineState = '~';
    let startIdx = 0;

    if (parts.length > 0 && LINE_STATE_SET.has(parts[0])) {
        lineState = parts[0];
        startIdx = 1;
    }

    const remaining = parts.slice(startIdx);
    if (remaining.length === 0) { return null; }

    const colOffset = line.indexOf(remaining[0]);

    return {
        rawAction: remaining[0],
        rawArgs: remaining.slice(1),
        lineState,
        lineno,
        colOffset: colOffset >= 0 ? colOffset : 0,
        rawText: line,
    };
}

/**
 * Tokenize full Catapillar source code.
 */
export function tokenizeSource(source: string): TokenizeResult {
    const tokens: Token[] = [];
    const warnings: TokenizeWarning[] = [];
    let inBlockComment = false;

    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const lineno = i + 1;
        let stripped = lines[i].trim();

        // Toggle block comment
        if (stripped === '~~') {
            inBlockComment = !inBlockComment;
            continue;
        }

        // Skip lines inside block comment
        if (inBlockComment) { continue; }

        // Inline comment warning + strip
        const hashIdx = stripped.indexOf('#');
        if (hashIdx > 0 && !stripped.startsWith('#')) {
            warnings.push({
                message: `Inline comments are not supported in Catapillar v0.1 (ignored) [line ${lineno}]`,
                lineno,
            });
            stripped = stripped.substring(0, hashIdx).trimEnd();
        }

        const token = tokenizeLine(stripped, lineno);
        if (token) {
            tokens.push(token);
        }
    }

    // Warn if block comment never closed
    if (inBlockComment) {
        warnings.push({
            message: 'Unclosed block comment (~~)',
            lineno: lines.length,
        });
    }

    return { tokens, warnings };
}
