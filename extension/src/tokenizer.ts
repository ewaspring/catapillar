/**
 * Catapillar tokenizer — TypeScript port of parser/tokenizer.py.
 * Converts raw source text into a flat list of Token objects.
 * Supports emoji/kaomoji prefix: first token is stripped so "印" is recognized as action.
 */

import { LINE_STATE_SET } from './keywords';

/** Emoji ranges (same as Python tokenizer). */
const EMOJI_RANGES: [number, number][] = [
    [0x1f600, 0x1f64f], [0x1f300, 0x1f5ff], [0x1f680, 0x1f6ff],
    [0x1f1e0, 0x1f1ff], [0x2600, 0x26ff],   [0x2700, 0x27bf],
    [0x1f900, 0x1f9ff], [0x1fa00, 0x1fa6f], [0x1fa70, 0x1faff],
    [0x231a, 0x231b],   [0x23e9, 0x23f3],   [0x23f8, 0x23fa],
    [0x25aa, 0x25ab],   [0x25b6, 0x25c0],   [0x25fb, 0x25fe],
    [0x2934, 0x2935],   [0x2b05, 0x2b07],   [0x2b1b, 0x2b1c],
    [0x200d, 0x200d],   [0xfe0f, 0xfe0f],
];

function isEmoji(token: string): boolean {
    if (!token || !token.length) return false;
    // Kaomoji: parenthesized face-like patterns, e.g. (*^▽^*)
    if (/^\(.*\)$/.test(token) && token.length >= 3) {
        const inner = token.slice(1, -1);
        if (/[▽△^*><_・ω゜]/.test(inner)) return true;
        if (Array.from(inner).some(c => {
            const cp = (c as string).codePointAt(0)!;
            return (cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x2b05 && cp <= 0x2b1c) || (cp >= 0x1f300 && cp <= 0x1f9ff);
        })) return true;
    }
    const cp = token.codePointAt(0)!;
    for (const [start, end] of EMOJI_RANGES) {
        if (cp >= start && cp <= end) return true;
    }
    return false;
}

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

    let remaining = parts.slice(startIdx);
    if (remaining.length === 0) { return null; }

    // Strip emoji/kaomoji prefix so "🌸 印 樱花开了" → action "印", args ["樱花开了"]
    if (remaining.length >= 2 && isEmoji(remaining[0])) {
        remaining = remaining.slice(1);
    }

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
