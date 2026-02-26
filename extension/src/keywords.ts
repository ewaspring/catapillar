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
export const KEYWORDS: KeywordInfo[] = [
    // === Actions ===
    {
        actionId: 'PRINT',
        forms: ['print', '印'],
        description: { en: 'Print output', ja: '出力', 'zh-cn': '打印输出' },
        detail: {
            en: 'Print values to standard output.\nSyntax: 印 value1 value2 ...\nDo not use parentheses; variables are resolved by declaration above.',
            ja: '標準出力に値を出力。\n構文: 印 値1 値2 ...\n括弧は使わない。',
            'zh-cn': '将值输出到标准输出。\n语法: 印 值1 值2 ...\n不要用括号；变量由上文的声明解析。',
        },
        category: 'action',
        opensBlock: false,
    },
    {
        actionId: 'SET',
        forms: ['set', '置'],
        description: { en: 'Set variable', ja: '変数設定', 'zh-cn': '设置变量' },
        detail: {
            en: 'Assign a value to a variable.\nSyntax: 置 name value\nUse bare names for variables; parentheses only for expression grouping (e.g. (a+b)*c).',
            ja: '変数に値を代入。\n構文: 置 名前 値\n括弧は式のグループ化のみ。',
            'zh-cn': '给变量赋值。\n语法: 置 变量名 值\n变量用裸名；括号仅用于表达式分组。',
        },
        category: 'action',
        opensBlock: false,
    },
    {
        actionId: 'CALL',
        forms: ['call', '调'],
        description: { en: 'Call function', ja: '関数呼び出し', 'zh-cn': '调用函数' },
        detail: {
            en: 'Call a defined function.\nSyntax: 调 function_name arg1 arg2 ...\nNo parentheses around arguments (调 f a b, not 调 f(a b)).',
            ja: '定義された関数を呼び出し。\n構文: 調 関数名 引数1 引数2 ...\n引数を括弧で囲まない。',
            'zh-cn': '调用已定义的函数。\n语法: 调 函数名 参数1 参数2 ...\n参数不要用括号。',
        },
        category: 'action',
        opensBlock: false,
    },

    // === Control Flow ===
    {
        actionId: 'DEF',
        forms: ['def', '定'],
        description: { en: 'Define function', ja: '関数定義', 'zh-cn': '定义函数' },
        detail: {
            en: 'Define a new function.\nSyntax: 定 name param1 param2:\n  body\n终',
            ja: '新しい関数を定義します。\n構文: 定 名前 引数1 引数2:\n  本体\n終',
            'zh-cn': '定义一个新函数。\n语法: 定 函数名 参数1 参数2:\n  函数体\n终',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'IF',
        forms: ['if', '若'],
        description: { en: 'If condition', ja: '条件分岐', 'zh-cn': '条件判断' },
        detail: {
            en: 'Conditional branch.\nSyntax: 若 condition:\n  body\n终\nParentheses only for expression grouping (e.g. (a 且 b) 或 c), not around the whole condition.',
            ja: '条件分岐。\n構文: 若 条件:\n  本体\n終\n括弧は式のグループ化のみ（例: (a 且 b) 或 c）。条件全体を括弧で囲まない。',
            'zh-cn': '条件分支。\n语法: 若 条件:\n  执行体\n终\n括号仅用于表达式分组（如 (a 且 b) 或 c），勿包住整个条件。',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'ELIF',
        forms: ['elif', '又若'],
        description: { en: 'Else if', ja: 'さもなくば（条件付き）', 'zh-cn': '否则如果' },
        detail: {
            en: 'Else-if branch. Must follow 若/if or 又若/elif block.\nSyntax: 又若 condition:',
            ja: 'else-if分岐。若/ifまたは又若/elifブロックの後に使用。\n構文: 又若 条件:',
            'zh-cn': '否则如果分支。必须在若/if或又若/elif块之后。\n语法: 又若 条件:',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'ELSE',
        forms: ['else', '否则'],
        description: { en: 'Else branch', ja: 'さもなくば', 'zh-cn': '否则' },
        detail: {
            en: 'Else branch. Must follow 若/if or 又若/elif block.\nSyntax: 否则:',
            ja: 'else分岐。若/ifまたは又若/elifブロックの後に使用。\n構文: 否則:',
            'zh-cn': '否则分支。必须在若/if或又若/elif块之后。\n语法: 否则:',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'WHILE',
        forms: ['while', '当'],
        description: { en: 'While loop', ja: 'whileループ', 'zh-cn': '循环' },
        detail: {
            en: 'Loop while condition is true.\nSyntax: 当 condition:\n  body\n终',
            ja: '条件が真の間ループします。\n構文: 当 条件:\n  本体\n終',
            'zh-cn': '当条件为真时循环。\n语法: 当 条件:\n  循环体\n终',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'FOR',
        forms: ['for', '扭扭', '回す'],
        description: { en: 'For loop', ja: 'forループ', 'zh-cn': '遍历循环' },
        detail: {
            en: 'Iterate over a sequence.\nSyntax: 扭扭 var 在 iterable:\nDo not use parentheses around iterable (use 扭扭 x 在 列表, not 在 (列表)).',
            ja: 'シーケンスを反復。\n構文: 扭扭 変数 在 イテラブル:\nイテラブルを括弧で囲まない。',
            'zh-cn': '遍历序列。\n语法: 扭扭 变量 在 序列:\n不要在可迭代对象外加括号（用 扭扭 x 在 列表）。',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'BREAK',
        forms: ['break', '断'],
        description: { en: 'Break loop', ja: 'ループ中断', 'zh-cn': '跳出循环' },
        detail: {
            en: 'Break out of the current loop.\nSyntax: 断',
            ja: '現在のループを中断します。\n構文: 断',
            'zh-cn': '跳出当前循环。\n语法: 断',
        },
        category: 'control',
        opensBlock: false,
    },
    {
        actionId: 'CONTINUE',
        forms: ['continue', '续'],
        description: { en: 'Continue loop', ja: 'ループ継続', 'zh-cn': '继续循环' },
        detail: {
            en: 'Skip to the next iteration of the loop.\nSyntax: 续',
            ja: 'ループの次の反復にスキップします。\n構文: 続',
            'zh-cn': '跳到循环的下一次迭代。\n语法: 续',
        },
        category: 'control',
        opensBlock: false,
    },
    {
        actionId: 'RETURN',
        forms: ['return', '回'],
        description: { en: 'Return value', ja: '値を返す', 'zh-cn': '返回值' },
        detail: {
            en: 'Return a value from a function.\nSyntax: 回 value\nParentheses only for expression grouping (e.g. (a+b)*c), not 回 (expr).',
            ja: '関数から値を返す。\n構文: 回 値\n括弧は式のグループ化のみ。',
            'zh-cn': '从函数返回一个值。\n语法: 回 值\n括号仅用于表达式分组，勿写 回 (表达式)。',
        },
        category: 'control',
        opensBlock: false,
    },
    {
        actionId: 'TRY',
        forms: ['try', '试'],
        description: { en: 'Try block', ja: 'tryブロック', 'zh-cn': '异常捕获' },
        detail: {
            en: 'Begin a try block for exception handling.\nSyntax: 试:\n  body\n捕 ExceptionType:\n  handler\n终',
            ja: '例外処理のtryブロックを開始します。\n構文: 試:\n  本体\n捕 例外型:\n  ハンドラ\n終',
            'zh-cn': '开始一个异常处理块。\n语法: 试:\n  执行体\n捕 异常类型:\n  处理代码\n终',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'EXCEPT',
        forms: ['except', '捕'],
        description: { en: 'Catch exception', ja: '例外捕捉', 'zh-cn': '捕获异常' },
        detail: {
            en: 'Catch an exception. Must follow 试/try block.\nSyntax: 捕 ExceptionType:',
            ja: '例外を捕捉します。試/tryブロックの後に使用。\n構文: 捕 例外型:',
            'zh-cn': '捕获异常。必须在试/try块之后。\n语法: 捕 异常类型:',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'FINALLY',
        forms: ['finally', '终于'],
        description: { en: 'Finally block', ja: 'finallyブロック', 'zh-cn': '最终执行' },
        detail: {
            en: 'Finally block, always executed.\nSyntax: 终于:',
            ja: '必ず実行されるfinallyブロック。\n構文: 終於:',
            'zh-cn': '始终执行的最终代码块。\n语法: 终于:',
        },
        category: 'control',
        opensBlock: true,
    },
    {
        actionId: 'PASS',
        forms: ['pass', '空'],
        description: { en: 'Empty statement', ja: '空文', 'zh-cn': '空语句' },
        detail: {
            en: 'An empty statement (placeholder).\nSyntax: 空',
            ja: '空の文（プレースホルダ）。\n構文: 空',
            'zh-cn': '一个空语句（占位符）。\n语法: 空',
        },
        category: 'control',
        opensBlock: false,
    },
    {
        actionId: 'GLOBAL',
        forms: ['global', '全局', '全'],
        description: { en: 'Global declaration', ja: 'グローバル宣言', 'zh-cn': '全局声明' },
        detail: {
            en: 'Declare names as global so assignment inside a function mutates the global variable.\nSyntax: 全局 name1 name2',
            ja: '関数内で代入時にグローバル変数を変更するよう宣言。\n構文: 全局 名前1 名前2',
            'zh-cn': '声明为全局，以便在函数内赋值时修改全局变量。\n语法: 全局 名字1 名字2',
        },
        category: 'control',
        opensBlock: false,
    },

    // === Arithmetic ===
    {
        actionId: 'ADD',
        forms: ['add', '加'],
        description: { en: 'Addition', ja: '加算', 'zh-cn': '加法' },
        detail: {
            en: 'Add two values.\nSyntax: 加 result left right\nOr inside SET: 置 result 加 left right',
            ja: '2つの値を加算します。\n構文: 加 結果 左 右\nまたはSET内: 置 結果 加 左 右',
            'zh-cn': '两个值相加。\n语法: 加 结果 左 右\n或在SET内: 置 结果 加 左 右',
        },
        category: 'arithmetic',
        opensBlock: false,
    },
    {
        actionId: 'SUB',
        forms: ['sub', '减'],
        description: { en: 'Subtraction', ja: '減算', 'zh-cn': '减法' },
        detail: {
            en: 'Subtract two values.\nSyntax: 减 result left right',
            ja: '2つの値を減算します。\n構文: 減 結果 左 右',
            'zh-cn': '两个值相减。\n语法: 减 结果 左 右',
        },
        category: 'arithmetic',
        opensBlock: false,
    },
    {
        actionId: 'MUL',
        forms: ['mul', '乘'],
        description: { en: 'Multiplication', ja: '乗算', 'zh-cn': '乘法' },
        detail: {
            en: 'Multiply two values.\nSyntax: 乘 result left right',
            ja: '2つの値を乗算します。\n構文: 乘 結果 左 右',
            'zh-cn': '两个值相乘。\n语法: 乘 结果 左 右',
        },
        category: 'arithmetic',
        opensBlock: false,
    },
    {
        actionId: 'DIV',
        forms: ['div', '除'],
        description: { en: 'Division', ja: '除算', 'zh-cn': '除法' },
        detail: {
            en: 'Divide two values.\nSyntax: 除 result left right',
            ja: '2つの値を除算します。\n構文: 除 結果 左 右',
            'zh-cn': '两个值相除。\n语法: 除 结果 左 右',
        },
        category: 'arithmetic',
        opensBlock: false,
    },
];

/** IN keyword (for FOR ... IN loops) */
export const IN_KEYWORDS: KeywordInfo[] = [
    {
        actionId: 'IN',
        forms: ['in', '在', '中'],
        description: { en: 'In (for loop)', ja: 'in（forループ）', 'zh-cn': '在（for 循环）' },
        detail: {
            en: 'FOR ... IN iterable. Syntax: 扭扭 var 在 iterable:',
            ja: 'FOR ... IN イテラブル。構文: 扭扭 変数 在 イテラブル:',
            'zh-cn': 'FOR ... IN 可迭代对象。语法: 扭扭 变量 在 可迭代:',
        },
        category: 'control',
        opensBlock: false,
    },
];

/** Struct keywords (block terminators) */
export const STRUCT_KEYWORDS: KeywordInfo[] = [
    {
        actionId: 'BLOCK_END',
        forms: ['end', '结束', '完了', '终', '終'],
        description: { en: 'End block', ja: 'ブロック終了', 'zh-cn': '结束块' },
        detail: {
            en: 'End a block (function, if, while, try, etc.).\nSyntax: 终',
            ja: 'ブロック（関数、if、while、tryなど）を終了します。\n構文: 終',
            'zh-cn': '结束一个块（函数、if、while、try等）。\n语法: 终',
        },
        category: 'struct',
        opensBlock: false,
    },
];

/** Line state symbols */
export const LINE_STATES: KeywordInfo[] = [
    {
        actionId: '~',
        forms: ['~'],
        description: { en: 'Continue (neutral)', ja: '継続（ニュートラル）', 'zh-cn': '继续（中性）' },
        detail: {
            en: 'Default line state. Continues the current behavioral segment.',
            ja: 'デフォルトの行態。現在の行為節を継続します。',
            'zh-cn': '默认行态。继续当前的行为节。',
        },
        category: 'linestate',
        opensBlock: false,
    },
    {
        actionId: '>',
        forms: ['>'],
        description: { en: 'Advance (segment boundary)', ja: 'アドバンス（セグメント境界）', 'zh-cn': '前进（段边界）' },
        detail: {
            en: 'Advance to the next behavioral segment.',
            ja: '次の行為節に進みます。',
            'zh-cn': '进入下一个行为节。',
        },
        category: 'linestate',
        opensBlock: false,
    },
    {
        actionId: '<',
        forms: ['<'],
        description: { en: 'Return / Echo', ja: '戻る / エコー', 'zh-cn': '返回 / 回显' },
        detail: {
            en: 'Return or echo — refers back to the previous segment.',
            ja: '戻るまたはエコー — 前のセグメントを参照します。',
            'zh-cn': '返回或回显 — 引用上一个段。',
        },
        category: 'linestate',
        opensBlock: false,
    },
    {
        actionId: '!',
        forms: ['!'],
        description: { en: 'Strong (commit)', ja: 'ストロング（コミット）', 'zh-cn': '强制（提交）' },
        detail: {
            en: 'Strong / commit — marks a critical, must-succeed action.',
            ja: 'ストロング / コミット — 必ず成功する必要があるアクションをマークします。',
            'zh-cn': '强制/提交 — 标记一个关键的、必须成功的动作。',
        },
        category: 'linestate',
        opensBlock: false,
    },
    {
        actionId: '?',
        forms: ['?'],
        description: { en: 'Tentative (await)', ja: 'テンタティブ（待機）', 'zh-cn': '待定（等待）' },
        detail: {
            en: 'Tentative / await — waits for external input.',
            ja: 'テンタティブ / 待機 — 外部入力を待ちます。',
            'zh-cn': '待定/等待 — 等待外部输入。',
        },
        category: 'linestate',
        opensBlock: false,
    },
];

/** Comparison / boolean operator keywords (used in conditions) */
export const OPERATOR_KEYWORDS = [
    { form: '是', meaning: '==', description: { en: 'equals', ja: '等しい', 'zh-cn': '等于' } },
    { form: '不是', meaning: '!=', description: { en: 'not equals', ja: '等しくない', 'zh-cn': '不等于' } },
    { form: '或', meaning: 'or', description: { en: 'or', ja: 'または', 'zh-cn': '或' } },
    { form: '且', meaning: 'and', description: { en: 'and', ja: 'かつ', 'zh-cn': '且' } },
    { form: '非', meaning: 'not', description: { en: 'not', ja: 'ではない', 'zh-cn': '非' } },
    { form: 'not', meaning: 'not', description: { en: 'not', ja: 'ではない', 'zh-cn': '非' } },
];

/** Null literal keywords */
export const NULL_LITERALS = ['无', 'none', '無'];

// =====================================================
// Lookup tables (built from definitions above)
// =====================================================

/** Map from surface form → action ID */
export const ACTION_LOOKUP: Map<string, string> = new Map();
for (const kw of KEYWORDS) {
    for (const form of kw.forms) {
        ACTION_LOOKUP.set(form, kw.actionId);
    }
}

/** Map from surface form → struct ID */
export const STRUCT_LOOKUP: Map<string, string> = new Map();
for (const kw of STRUCT_KEYWORDS) {
    for (const form of kw.forms) {
        STRUCT_LOOKUP.set(form, kw.actionId);
    }
}

/** Set of line state characters */
export const LINE_STATE_SET = new Set(['~', '>', '<', '!', '?']);

/** Map from action ID → KeywordInfo */
export const KEYWORD_BY_ID: Map<string, KeywordInfo> = new Map();
for (const kw of [...KEYWORDS, ...STRUCT_KEYWORDS, ...IN_KEYWORDS, ...LINE_STATES]) {
    KEYWORD_BY_ID.set(kw.actionId, kw);
}

/** Map from surface form → KeywordInfo */
export const KEYWORD_BY_FORM: Map<string, KeywordInfo> = new Map();
for (const kw of [...KEYWORDS, ...STRUCT_KEYWORDS, ...IN_KEYWORDS, ...LINE_STATES]) {
    for (const form of kw.forms) {
        KEYWORD_BY_FORM.set(form, kw);
    }
}

/** All forms that open a block (require 终 to close) */
export const BLOCK_OPENERS = new Set<string>();
for (const kw of KEYWORDS) {
    if (kw.opensBlock) {
        for (const form of kw.forms) {
            BLOCK_OPENERS.add(form);
        }
    }
}
