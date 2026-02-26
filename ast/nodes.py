# ast/nodes.py
# Catapillar AST node definitions.
# Most AST nodes are plain dicts (see parser/parser.py for structure).
# This module contains class-based nodes for Arrow and documents
# all dict-based node types used across the system.

# ---- Dict-based expression node types (M1) ----
#
# {"type": "NumberLiteral",  "value": "42"}
# {"type": "BoolLiteral",   "value": True/False}
# {"type": "NoneLiteral"}
# {"type": "Identifier",    "name": "x"}
# {"type": "StringLiteral", "value": "hello"}
# {"type": "BinaryExpr",    "op": "+", "left": expr, "right": expr}
# {"type": "UnaryExpr",     "op": "-", "operand": expr}
# {"type": "ListLiteral",   "elements": [expr, ...]}
# {"type": "DictLiteral",   "entries": [{"key": expr, "value": expr}, ...]}
# {"type": "IndexAccess",   "container": expr, "index": expr}
# {"type": "CallExpr",      "func": "name", "args": [expr, ...]}


class Arrow:
    def __init__(self, from_, to_, state=None):
        self.from_ = from_
        self.to_ = to_
        self.state = state
