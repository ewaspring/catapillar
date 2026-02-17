/**
 * Catapillar keyword definitions.
 * Single source of truth for all action IDs, struct IDs, and line states.
 * Mirrors parser/parser.py ACTION_IDS, STRUCT_IDS, and LINE_STATES.
 */
export interface KeywordInfo {
    actionId: string;
    forms: string[];
    description: {
        en: string;
        ja: string;
        'zh-cn': string;
    };
    detail: {
        en: string;
        ja: string;
        'zh-cn': string;
    };
    category: 'action' | 'control' | 'arithmetic' | 'struct' | 'linestate';
    opensBlock: boolean;
}
/** All action keywords with their surface forms and documentation */
export declare const KEYWORDS: KeywordInfo[];
/** Struct keywords (block terminators) */
export declare const STRUCT_KEYWORDS: KeywordInfo[];
/** Line state symbols */
export declare const LINE_STATES: KeywordInfo[];
/** Comparison / boolean operator keywords (used in conditions) */
export declare const OPERATOR_KEYWORDS: {
    form: string;
    meaning: string;
    description: {
        en: string;
        ja: string;
        'zh-cn': string;
    };
}[];
/** Map from surface form → action ID */
export declare const ACTION_LOOKUP: Map<string, string>;
/** Map from surface form → struct ID */
export declare const STRUCT_LOOKUP: Map<string, string>;
/** Set of line state characters */
export declare const LINE_STATE_SET: Set<string>;
/** Map from action ID → KeywordInfo */
export declare const KEYWORD_BY_ID: Map<string, KeywordInfo>;
/** Map from surface form → KeywordInfo */
export declare const KEYWORD_BY_FORM: Map<string, KeywordInfo>;
/** All forms that open a block (require 终 to close) */
export declare const BLOCK_OPENERS: Set<string>;
//# sourceMappingURL=keywords.d.ts.map