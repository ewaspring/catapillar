# parser/expr.py
# Catapillar expression parser (recursive descent).
# Grammar: Expression → OrExpr → AndExpr → ... → Primary (Literal | Identifier | List | Dict | "(" Expr ")" | index).

from typing import List, Dict, Tuple, Optional

from parser.errors import ParseError
from parser.tokenizer import tokenize_expression
from parser.constants import (
    COMPARE_OPS,
    BOOL_TRUE,
    BOOL_FALSE,
    NONE_LITERALS,
    MAP_PREFIXES,
    ARITH_LEGACY,
)


def parse_expression(
    tokens: List[str],
    pos: int = 0,
    value_context: bool = False,
    known_names: Optional[set] = None,
) -> Tuple[Dict, int]:
    """value_context=True: bare identifier → string (or variable if known_names and name in it)."""
    return _parse_or(tokens, pos, value_context, known_names)


def _parse_or(tokens, pos, value_context=False, known_names=None):
    left, pos = _parse_and(tokens, pos, value_context, known_names)
    while pos < len(tokens) and tokens[pos] in ("或", "or"):
        pos += 1
        right, pos = _parse_and(tokens, pos, value_context, known_names)
        left = {"type": "BinaryExpr", "op": "or", "left": left, "right": right}
    return left, pos


def _parse_and(tokens, pos, value_context=False, known_names=None):
    left, pos = _parse_not(tokens, pos, value_context, known_names)
    while pos < len(tokens) and tokens[pos] in ("且", "and"):
        pos += 1
        right, pos = _parse_not(tokens, pos, value_context, known_names)
        left = {"type": "BinaryExpr", "op": "and", "left": left, "right": right}
    return left, pos


def _parse_not(tokens, pos, value_context=False, known_names=None):
    if pos < len(tokens) and tokens[pos] in ("非", "not"):
        pos += 1
        operand, pos = _parse_not(tokens, pos, value_context, known_names)
        return {"type": "UnaryExpr", "op": "not", "operand": operand}, pos
    return _parse_compare(tokens, pos, value_context, known_names)


def _parse_compare(tokens, pos, value_context=False, known_names=None):
    left, pos = _parse_add(tokens, pos, value_context, known_names)
    if pos < len(tokens) and tokens[pos] in COMPARE_OPS:
        op = COMPARE_OPS[tokens[pos]]
        pos += 1
        right, pos = _parse_add(tokens, pos, value_context=True, known_names=known_names)
        left = {"type": "BinaryExpr", "op": op, "left": left, "right": right}
    return left, pos


def _parse_add(tokens, pos, value_context=False, known_names=None):
    left, pos = _parse_mul(tokens, pos, value_context, known_names)
    while pos < len(tokens) and tokens[pos] in ("+", "-"):
        op = tokens[pos]
        pos += 1
        right, pos = _parse_mul(tokens, pos, value_context, known_names)
        left = {"type": "BinaryExpr", "op": op, "left": left, "right": right}
    return left, pos


def _parse_mul(tokens, pos, value_context=False, known_names=None):
    left, pos = _parse_unary(tokens, pos, value_context, known_names)
    while pos < len(tokens) and tokens[pos] in ("*", "/"):
        op = tokens[pos]
        pos += 1
        right, pos = _parse_unary(tokens, pos, value_context, known_names)
        left = {"type": "BinaryExpr", "op": op, "left": left, "right": right}
    return left, pos


def _parse_unary(tokens, pos, value_context=False, known_names=None):
    if pos < len(tokens) and tokens[pos] in ("+", "-"):
        if pos + 1 < len(tokens):
            op = tokens[pos]
            pos += 1
            operand, pos = _parse_unary(tokens, pos, value_context, known_names)
            return {"type": "UnaryExpr", "op": op, "operand": operand}, pos
    return _parse_primary(tokens, pos, value_context, known_names)


def _parse_primary(tokens, pos, value_context=False, known_names=None):
    if pos >= len(tokens):
        raise ParseError("Unexpected end of expression")

    token = tokens[pos]

    if token in BOOL_TRUE:
        node = {"type": "BoolLiteral", "value": True}
        pos += 1
    elif token in BOOL_FALSE:
        node = {"type": "BoolLiteral", "value": False}
        pos += 1
    elif token in NONE_LITERALS:
        node = {"type": "NoneLiteral"}
        pos += 1
    elif token.startswith("``") and token.endswith("``") and len(token) > 4:
        node = {"type": "StringLiteral", "value": token[2:-2]}
        pos += 1
    elif _is_numeric(token):
        node = {"type": "NumberLiteral", "value": token}
        pos += 1
    elif token == "(":
        pos += 1
        close = _find_matching_paren(tokens, pos - 1)
        if close is None or close <= pos:
            raise ParseError("Unmatched '('")
        inner_tokens = tokens[pos:close]
        pos = close + 1
        node, ok = _try_parse_tokens(
            inner_tokens, value_context=False, known_names=known_names
        )
        if node is None:
            raise ParseError("Invalid parenthesized expression")
        _PAREN_DISALLOWED = (
            "Identifier", "NumberLiteral", "StringLiteral",
            "BoolLiteral", "NoneLiteral", "ListLiteral", "DictLiteral",
            "UnaryExpr",
        )
        if ok and node.get("type") in _PAREN_DISALLOWED:
            raise ParseError(
                "Parentheses are only for expression grouping (e.g. (a + b) * c). "
                "Do not use (variable) or (literal); use the name or value without parentheses."
            )
    elif token in MAP_PREFIXES:
        if pos + 1 < len(tokens) and tokens[pos + 1] == "[":
            node, pos = _parse_dict_literal(tokens, pos)
        else:
            node = {"type": "Identifier", "name": token}
            pos += 1
    elif token == "[":
        node, pos = _parse_list_or_dict(tokens, pos, value_context)
    elif token.isidentifier():
        if value_context:
            # Print context: known variable → Identifier, else string
            if known_names is not None:
                node = {"type": "Identifier", "name": token} if token in known_names else {"type": "StringLiteral", "value": token}
            else:
                node = {"type": "StringLiteral", "value": token}
        else:
            node = {"type": "Identifier", "name": token}
        pos += 1
    else:
        node = {"type": "StringLiteral", "value": token}
        pos += 1

    while pos < len(tokens) and tokens[pos] == "[":
        pos += 1
        index, pos = parse_expression(tokens, pos, value_context=True, known_names=None)
        if pos >= len(tokens) or tokens[pos] != "]":
            raise ParseError("Expected ']' in index access")
        pos += 1
        node = {"type": "IndexAccess", "container": node, "index": index}

    return node, pos


def _parse_list_or_dict(tokens, pos, value_context=False):
    pos += 1
    if pos < len(tokens) and tokens[pos] == "]":
        return {"type": "ListLiteral", "elements": []}, pos + 1

    save_pos = pos
    first, next_pos = parse_expression(tokens, pos, value_context=True)
    if next_pos < len(tokens) and tokens[next_pos] in (":", "："):
        return _parse_dict_entries(tokens, save_pos)

    elements = [first]
    pos = next_pos
    while pos < len(tokens) and tokens[pos] == "|":
        pos += 1
        elem, pos = parse_expression(tokens, pos, value_context=True)
        elements.append(elem)

    if pos >= len(tokens) or tokens[pos] != "]":
        raise ParseError("Expected ']' in list literal")
    return {"type": "ListLiteral", "elements": elements}, pos + 1


def _parse_dict_literal(tokens, pos):
    pos += 1
    if pos >= len(tokens) or tokens[pos] != "[":
        raise ParseError("Expected '[' after map prefix")
    pos += 1
    if pos < len(tokens) and tokens[pos] == "]":
        return {"type": "DictLiteral", "entries": []}, pos + 1
    return _parse_dict_entries(tokens, pos)


def _parse_dict_entries(tokens, pos):
    entries = []
    while True:
        key, pos = parse_expression(tokens, pos, value_context=True)
        if pos >= len(tokens) or tokens[pos] not in (":", "："):
            raise ParseError("Expected ':' in dict entry")
        pos += 1
        value, pos = parse_expression(tokens, pos, value_context=True)
        entries.append({"key": key, "value": value})
        if pos < len(tokens) and tokens[pos] == "|":
            pos += 1
            continue
        break
    if pos >= len(tokens) or tokens[pos] != "]":
        raise ParseError("Expected ']' in dict literal")
    return {"type": "DictLiteral", "entries": entries}, pos + 1


def _is_numeric(s: str) -> bool:
    if not s:
        return False
    try:
        float(s)
        return True
    except ValueError:
        return False


def _find_matching_paren(tokens: List[str], open_pos: int) -> Optional[int]:
    depth = 1
    i = open_pos + 1
    while i < len(tokens):
        if tokens[i] == "(":
            depth += 1
        elif tokens[i] == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return None


def strip_trailing_colon(raw_args: List[str]) -> List[str]:
    if not raw_args:
        return []
    cleaned = list(raw_args)
    if cleaned[-1].endswith(":"):
        cleaned[-1] = cleaned[-1][:-1]
        if not cleaned[-1]:
            cleaned.pop()
    return cleaned


def try_parse_expr_full(
    raw_args: List[str],
    value_context: bool = False,
    known_names: Optional[set] = None,
) -> Tuple[Dict, bool]:
    if not raw_args:
        return None, False
    expr_tokens = tokenize_expression(raw_args)
    if not expr_tokens:
        return None, False
    return _try_parse_tokens(expr_tokens, value_context=value_context, known_names=known_names)


def _try_parse_tokens(
    expr_tokens: List[str],
    value_context: bool = False,
    known_names: Optional[set] = None,
) -> Tuple[Dict, bool]:
    if not expr_tokens:
        return None, False
    try:
        node, pos = parse_expression(
            expr_tokens, 0, value_context=value_context, known_names=known_names
        )
        if pos == len(expr_tokens):
            return node, True
        if node.get("type") == "Identifier":
            func_name = node["name"]
            arg_nodes = []
            while pos < len(expr_tokens):
                arg, pos = parse_expression(
                    expr_tokens, pos, value_context=True, known_names=known_names
                )
                arg_nodes.append(arg)
            return {"type": "CallExpr", "func": func_name, "args": arg_nodes}, True
    except ParseError as e:
        if "Parentheses are only for expression grouping" in str(e):
            raise
        pass
    return None, False


def parse_condition(
    raw_args: List[str], known_names: Optional[set] = None
) -> Dict:
    args = strip_trailing_colon(raw_args)
    if not args:
        raise ParseError("Empty condition")
    expr_tokens = tokenize_expression(args)
    node, ok = _try_parse_tokens(
        expr_tokens, value_context=True, known_names=known_names
    )
    if ok:
        return node
    raise ParseError(f"Cannot parse condition: {' '.join(args)}")


def parse_set_value(
    expr_tokens: List[str], known_names: Optional[set] = None
) -> Dict:
    if not expr_tokens:
        raise ParseError("SET missing value")
    if expr_tokens[0] in ARITH_LEGACY and len(expr_tokens) == 3:
        op = ARITH_LEGACY[expr_tokens[0]]
        left, _ = parse_expression(
            [expr_tokens[1]], 0, value_context=True, known_names=known_names
        )
        right, _ = parse_expression(
            [expr_tokens[2]], 0, value_context=True, known_names=known_names
        )
        return {"type": "BinaryExpr", "op": op, "left": left, "right": right}
    node, ok = _try_parse_tokens(
        expr_tokens, value_context=True, known_names=known_names
    )
    if ok:
        return node
    # Avoid treating list/dict literals as string when first parse failed (would cause TypeError on index set)
    if expr_tokens and expr_tokens[0] == "[" and "]" in expr_tokens:
        try:
            node, pos = parse_expression(
                expr_tokens, 0, value_context=True, known_names=known_names
            )
            if pos == len(expr_tokens):
                return node
        except ParseError:
            pass
    return {"type": "StringLiteral", "value": " ".join(expr_tokens)}


def parse_print_value(raw_args: List[str], known_names: Optional[set] = None) -> Dict:
    """Parse print argument: if identifier is in known_names → variable, else → string/number."""
    if not raw_args:
        return None
    expr_tokens = tokenize_expression(raw_args)
    if not expr_tokens:
        return None
    if len(expr_tokens) == 1:
        t = expr_tokens[0]
        if t in BOOL_TRUE:
            return {"type": "BoolLiteral", "value": True}
        if t in BOOL_FALSE:
            return {"type": "BoolLiteral", "value": False}
        if t in NONE_LITERALS:
            return {"type": "NoneLiteral"}
        if _is_numeric(t):
            return {"type": "NumberLiteral", "value": t}
        if t.isidentifier():
            if known_names is not None and t in known_names:
                return {"type": "Identifier", "name": t}
            return {"type": "StringLiteral", "value": t}
    try:
        node, pos = parse_expression(expr_tokens, 0, value_context=True, known_names=known_names)
        if pos == len(expr_tokens):
            return node
    except ParseError as e:
        if "Parentheses are only for expression grouping" in str(e):
            raise
        pass
    return {"type": "StringLiteral", "value": " ".join(raw_args)}
