# parser/parser.py
# Catapillar parser: token list → AST.
# Supports arrow lines and legacy action lines. Expression parsing lives in parser.expr.

from typing import List, Dict

from parser.errors import ParseError
from parser.tokenizer import tokenize_expression
from parser.constants import ACTION_LOOKUP, STRUCT_LOOKUP, LINE_STATES, IN_KEYWORDS
from parser.expr import (
    parse_expression,
    parse_condition,
    parse_set_value,
    parse_print_value,
    try_parse_expr_full,
    strip_trailing_colon,
)


# ============================================================
# Core Parser
# ============================================================

def _declared_names(action_id: str, line_node: Dict, raw_args: List[str]) -> set:
    """Names declared by this line (for print variable resolution)."""
    out = set()
    if action_id == "SET" and "name" in line_node:
        out.add(line_node["name"])
    elif action_id == "INDEX_SET" and "container" in line_node:
        out.add(line_node["container"])
    elif action_id == "FOR" and "var" in line_node:
        out.add(line_node["var"])
    elif action_id == "DEF" and raw_args:
        name = raw_args[0].rstrip(":")
        if name:
            out.add(name)
        for a in raw_args[1:]:
            s = a.rstrip(":")
            if s:
                out.add(s)
    return out


def parse_tokens(tokens: List[Dict]) -> Dict:
    """
    Convert token list into Catapillar AST.
    Supports arrow lines (intent flow) and legacy action lines (with expression parsing).
    Tracks known_names (variables declared so far) so 印 can resolve variable vs string.
    """
    program = {"type": "Program", "flows": []}
    current_flow = {"type": "Flow", "segments": []}
    current_segment = {"type": "Segment", "lines": []}
    known_names = set()

    for token in tokens:
        raw_action = token["raw_action"]
        raw_args = token["raw_args"]
        line_state = token["line_state"]
        emoji = token.get("emoji_prefix")

        if raw_action in STRUCT_LOOKUP:
            struct_id = STRUCT_LOOKUP[raw_action]
            if struct_id == "BLOCK_END":
                line_node = {"type": "BLOCK_END", "line_state": line_state}
                if emoji:
                    line_node["emoji"] = emoji
                current_segment["lines"].append(line_node)
                continue

        if line_state not in LINE_STATES:
            raise ParseError(f"Invalid line_state: {line_state}")

        arrow_type = None
        if "->" in raw_args:
            arrow_type = "->"
        elif "<-" in raw_args:
            arrow_type = "<-"

        if raw_action.endswith(":"):
            block_name = raw_action[:-1]
            if block_name in ["否则", "else"]:
                line_node = {"type": "Line", "action": "ELSE", "args": [], "line_state": line_state}
                if emoji:
                    line_node["emoji"] = emoji
                current_segment["lines"].append(line_node)
                continue
            elif block_name in ["试", "try"]:
                line_node = {"type": "Line", "action": "TRY", "args": [], "line_state": line_state}
                if emoji:
                    line_node["emoji"] = emoji
                current_segment["lines"].append(line_node)
                continue
            elif block_name in ["终于", "finally"]:
                line_node = {"type": "Line", "action": "FINALLY", "args": [], "line_state": line_state}
                if emoji:
                    line_node["emoji"] = emoji
                current_segment["lines"].append(line_node)
                continue
            else:
                block_node = {"type": "Block", "name": block_name, "lines": [], "line_state": line_state}
                current_segment["lines"].append(block_node)
                known_names.add(block_name)
                continue

        if arrow_type:
            idx = raw_args.index(arrow_type)
            if idx + 1 >= len(raw_args):
                raise ParseError("Arrow missing target")
            left, right = raw_action, raw_args[idx + 1]
            from_node, to_node = (left, right) if arrow_type == "->" else (right, left)
            line_node = {"type": "Arrow", "from": from_node, "to": to_node, "direction": arrow_type, "line_state": line_state}
            current_segment["lines"].append(line_node)
        else:
            if raw_action not in ACTION_LOOKUP:
                raise ParseError(f"Unknown action: {raw_action}")
            action_id = ACTION_LOOKUP[raw_action]
            line_node = _build_action_line(action_id, raw_args, line_state, emoji, known_names)
            current_segment["lines"].append(line_node)
            known_names |= _declared_names(action_id, line_node, raw_args)

        if line_state == ">":
            current_flow["segments"].append(current_segment)
            current_segment = {"type": "Segment", "lines": []}

    if current_segment["lines"]:
        current_flow["segments"].append(current_segment)
    if current_flow["segments"]:
        program["flows"].append(current_flow)

    return program


# ============================================================
# Action Line Builder
# ============================================================

def _build_action_line(
    action_id: str, raw_args: List[str], line_state: str, emoji: str, known_names: set = None
) -> Dict:
    if known_names is None:
        known_names = set()
    base = {"type": "Line", "action": action_id, "line_state": line_state}
    if emoji:
        base["emoji"] = emoji

    if action_id == "SET":
        if not raw_args:
            raise ParseError("SET expects arguments")
        expr_tokens = tokenize_expression(raw_args)

        if len(expr_tokens) >= 5 and expr_tokens[1] == "[":
            depth, close = 0, None
            for i in range(1, len(expr_tokens)):
                if expr_tokens[i] == "[":
                    depth += 1
                elif expr_tokens[i] == "]":
                    depth -= 1
                    if depth == 0:
                        close = i
                        break
            if close is not None and close + 1 < len(expr_tokens):
                base["action"] = "INDEX_SET"
                base["container"] = expr_tokens[0]
                idx_node, _ = parse_expression(
                    expr_tokens[2:close], 0, value_context=True, known_names=known_names
                )
                base["index"] = idx_node
                base["value"] = parse_set_value(expr_tokens[close + 1:], known_names=known_names)
                base["args"] = raw_args
                return base

        base["name"] = expr_tokens[0]
        base["value"] = (
            parse_set_value(expr_tokens[1:], known_names=known_names)
            if len(expr_tokens) > 1
            else {"type": "NoneLiteral"}
        )
        base["args"] = raw_args
        return base

    if action_id == "PRINT":
        base["value"] = parse_print_value(raw_args, known_names=known_names)
        base["args"] = raw_args
        return base

    if action_id in ("IF", "ELIF", "WHILE"):
        base["condition"] = parse_condition(raw_args, known_names=known_names)
        base["args"] = raw_args
        return base

    if action_id == "FOR":
        if len(raw_args) < 3:
            raise ParseError("FOR expects: variable IN iterable")
        var = raw_args[0]
        if raw_args[1] not in IN_KEYWORDS:
            raise ParseError(f"FOR expects IN keyword, got: {raw_args[1]}")
        iterable_args = strip_trailing_colon(raw_args[2:])
        node, ok = try_parse_expr_full(
            iterable_args, value_context=True, known_names=known_names
        )
        if not ok:
            node = {"type": "Identifier", "name": " ".join(iterable_args)}
        base["var"] = var
        base["iterable"] = node
        base["args"] = raw_args
        return base

    if action_id == "RETURN":
        if raw_args:
            node, ok = try_parse_expr_full(
                raw_args, value_context=True, known_names=known_names
            )
            base["value"] = node if ok else {"type": "Identifier", "name": " ".join(raw_args)}
        else:
            base["value"] = None
        base["args"] = raw_args
        return base

    if action_id == "CALL":
        if not raw_args:
            raise ParseError("CALL expects a function name")
        base["func"] = raw_args[0]
        call_args = []
        for a in raw_args[1:]:
            node, ok = try_parse_expr_full(
                [a], value_context=True, known_names=known_names
            )
            call_args.append(node if ok else {"type": "Identifier", "name": a})
        base["call_args"] = call_args
        base["args"] = raw_args
        return base

    if action_id == "GLOBAL":
        base["names"] = list(raw_args)
        return base

    base["args"] = raw_args
    return base


def parse_file(path: str) -> Dict:
    """Tokenize + parse in one step."""
    from parser.tokenizer import tokenize_file
    tokens = tokenize_file(path)
    return parse_tokens(tokens)
