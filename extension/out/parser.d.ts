/**
 * Catapillar parser — TypeScript port of parser/parser.py.
 * Converts tokens into an AST.
 */
export interface ProgramNode {
    type: 'Program';
    flows: FlowNode[];
}
export interface FlowNode {
    type: 'Flow';
    segments: SegmentNode[];
}
export interface SegmentNode {
    type: 'Segment';
    lines: StatementNode[];
}
export type StatementNode = LineNode | BlockNode | ArrowNode | BlockEndNode;
export interface LineNode {
    type: 'Line';
    action: string;
    args: string[];
    lineState: string;
    lineno: number;
}
export interface BlockNode {
    type: 'Block';
    name: string;
    lineState: string;
    lineno: number;
}
export interface ArrowNode {
    type: 'Arrow';
    from: string;
    to: string;
    direction: '->' | '<-';
    lineState: string;
    lineno: number;
}
export interface BlockEndNode {
    type: 'BLOCK_END';
    lineState: string;
    lineno: number;
}
export interface ParseDiagnostic {
    message: string;
    lineno: number;
    severity: 'error' | 'warning';
    colStart?: number;
    colEnd?: number;
}
export interface ParseResult {
    program: ProgramNode;
    diagnostics: ParseDiagnostic[];
    symbols: SymbolEntry[];
}
export interface SymbolEntry {
    name: string;
    kind: 'function' | 'variable' | 'block';
    lineno: number;
    params?: string[];
}
/**
 * Parse source code into a Catapillar AST with diagnostics.
 * Unlike the Python parser, this does NOT throw on errors — it collects
 * diagnostics so the extension can show them all at once.
 */
export declare function parseSource(source: string): ParseResult;
/**
 * Get all defined function names from a parsed result.
 */
export declare function getFunctionSymbols(result: ParseResult): SymbolEntry[];
/**
 * Get all variable assignments from a parsed result.
 */
export declare function getVariableSymbols(result: ParseResult): SymbolEntry[];
//# sourceMappingURL=parser.d.ts.map