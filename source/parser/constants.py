# parser/constants.py
# Catapillar parser constants: action IDs, keywords, operators.
# Used by parser and expression parser.

# ------------------------------------------------------------
# Canonical Action Set (Legacy DSL)
# ------------------------------------------------------------

ACTION_IDS = {
    "PRINT": {"print", "印"},
    "SET": {"set", "置"},
    "CALL": {"call", "调"},
    "DEF": {"def", "定"},
    "RETURN": {"return", "回"},
    "IF": {"if", "若"},
    "ELIF": {"elif", "又若"},
    "ELSE": {"else", "否则"},
    "WHILE": {"while", "当"},
    "FOR": {"for", "扭扭", "回す"},
    "BREAK": {"break", "断"},
    "CONTINUE": {"continue", "续"},
    "TRY": {"try", "试"},
    "EXCEPT": {"except", "捕"},
    "FINALLY": {"finally", "终于"},
    "PASS": {"pass", "空"},
    "GLOBAL": {"global", "全局", "全"},
    "ADD": {"add", "加"},
    "SUB": {"sub", "减"},
    "MUL": {"mul", "乘"},
    "DIV": {"div", "除"},
}

STRUCT_IDS = {
    "BLOCK_END": {"end", "结束", "完了", "终", "終"},
}

ACTION_LOOKUP = {
    word: action_id
    for action_id, words in ACTION_IDS.items()
    for word in words
}

STRUCT_LOOKUP = {
    word: struct_id
    for struct_id, words in STRUCT_IDS.items()
    for word in words
}

LINE_STATES = {"~", ">", "<", "!", "?"}

# M1 keywords and operators
IN_KEYWORDS = {"in", "在", "中"}

COMPARE_OPS = {
    "是": "==", "不是": "!=",
    "==": "==", "!=": "!=",
    ">": ">", "<": "<", ">=": ">=", "<=": "<=",
}

BOOL_TRUE = {"真", "true"}
BOOL_FALSE = {"假", "false", "偽"}
NONE_LITERALS = {"无", "none", "無"}
MAP_PREFIXES = {"映", "map", "辞"}

ARITH_LEGACY = {
    "加": "+", "减": "-", "乘": "*", "除": "/",
    "add": "+", "sub": "-", "mul": "*", "div": "/",
}
