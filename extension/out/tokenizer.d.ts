/**
 * Catapillar tokenizer — TypeScript port of parser/tokenizer.py.
 * Converts raw source text into a flat list of Token objects.
 */
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
export declare function tokenizeLine(line: string, lineno: number): Token | null;
/**
 * Tokenize full Catapillar source code.
 */
export declare function tokenizeSource(source: string): TokenizeResult;
//# sourceMappingURL=tokenizer.d.ts.map