# mapper/python_mapper.py
# Catapillar v0.2 Python mapper
# Responsibility: AST -> Python source code with proper indentation and control flow

from typing import Dict, List, Tuple


class MapError(Exception):
    pass


# Known no-arg functions — when used alone as SET value, call with ()
_KNOWN_CALL_FUNCTIONS = {"读数", "读运算符", "input", "float", "int", "str"}


class IndentContext:
    """Manages indentation levels for Python code generation."""
    def __init__(self):
        self.level = 0
        self.indent_str = "    "  # 4 spaces
        self.last_was_block_end = False

    def indent(self):
        self.level += 1

    def dedent(self):
        if self.level > 0:
            self.level -= 1

    def get_indent(self) -> str:
        return self.indent_str * self.level


# ============================================================
# Expression → Python Code
# ============================================================

def map_expr(expr: Dict) -> str:
    """Convert an expression AST node to Python source."""
    if expr is None:
        return "None"

    t = expr.get("type")

    if t == "NumberLiteral":
        return expr["value"]

    if t == "BoolLiteral":
        return "True" if expr["value"] else "False"

    if t == "NoneLiteral":
        return "None"

    if t == "Identifier":
        return expr["name"]

    if t == "StringLiteral":
        value = expr["value"]
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'

    if t == "BinaryExpr":
        left = map_expr(expr["left"])
        right = map_expr(expr["right"])
        return f"({left} {expr['op']} {right})"

    if t == "UnaryExpr":
        operand = map_expr(expr["operand"])
        op = expr["op"]
        if op == "not":
            return f"(not {operand})"
        return f"({op}{operand})"

    if t == "ListLiteral":
        elements = [map_expr(e) for e in expr["elements"]]
        return f"[{', '.join(elements)}]"

    if t == "DictLiteral":
        entries = []
        for e in expr["entries"]:
            key = e["key"]
            if key.get("type") == "Identifier":
                key_str = f'"{key["name"]}"'
            else:
                key_str = map_expr(key)
            entries.append(f"{key_str}: {map_expr(e['value'])}")
        return "{" + ", ".join(entries) + "}"

    if t == "IndexAccess":
        container = map_expr(expr["container"])
        index = map_expr(expr["index"])
        return f"{container}[{index}]"

    if t == "CallExpr":
        func = expr["func"]
        args = [map_expr(a) for a in expr.get("args", [])]
        return f"{func}({', '.join(args)})"

    raise MapError(f"Unknown expression type: {t}")


# ============================================================
# Program / Flow / Segment
# ============================================================

def map_program(program: Dict) -> str:
    if program.get("type") != "Program":
        raise MapError("Root node must be Program")

    ctx = IndentContext()
    lines: List[str] = []

    for flow in program.get("flows", []):
        lines.extend(map_flow(flow, ctx))

    return "\n".join(lines)


def map_flow(flow: Dict, ctx: IndentContext) -> List[str]:
    if flow.get("type") != "Flow":
        raise MapError("Expected Flow node")

    lines: List[str] = []
    for segment in flow.get("segments", []):
        lines.extend(map_segment(segment, ctx))
    return lines


def map_segment(segment: Dict, ctx: IndentContext) -> List[str]:
    if segment.get("type") != "Segment":
        raise MapError("Expected Segment node")

    lines: List[str] = []
    for line in segment.get("lines", []):
        result = map_statement(line, ctx)
        if result:
            lines.extend(result)
    return lines


# ============================================================
# Statement Dispatch
# ============================================================

def map_statement(stmt: Dict, ctx: IndentContext) -> List[str]:
    stmt_type = stmt.get("type")

    if stmt_type == "Line":
        result = _map_line_with_block_end_tracking(stmt, ctx)
        ctx.last_was_block_end = False
        return result
    elif stmt_type == "Block":
        ctx.last_was_block_end = False
        return []
    elif stmt_type == "BLOCK_END":
        ctx.dedent()
        ctx.last_was_block_end = True
        return []
    elif stmt_type == "Arrow":
        return []
    else:
        raise MapError(f"Unknown statement type: {stmt_type}")


def _map_line_with_block_end_tracking(line: Dict, ctx: IndentContext) -> List[str]:
    """Dedent once before ELIF/ELSE/EXCEPT/FINALLY when no 终 preceded them."""
    action = line.get("action")
    if action in ("ELIF", "ELSE", "EXCEPT", "FINALLY") and not ctx.last_was_block_end:
        ctx.dedent()
    return _map_line(line, ctx)


def _map_line(line: Dict, ctx: IndentContext) -> List[str]:
    """Map Line node to Python code."""
    if line.get("type") != "Line":
        raise MapError("Expected Line node")

    action = line.get("action")
    indent = ctx.get_indent()

    # Control flow blocks
    if action == "DEF":
        return _map_def(line, ctx)
    elif action == "IF":
        return _map_if(line, ctx)
    elif action == "ELIF":
        return _map_elif(line, ctx)
    elif action == "ELSE":
        return _map_else(line, ctx)
    elif action == "WHILE":
        return _map_while(line, ctx)
    elif action == "FOR":
        return _map_for(line, ctx)
    elif action == "TRY":
        return _map_try(line, ctx)
    elif action == "EXCEPT":
        return _map_except(line, ctx)
    elif action == "FINALLY":
        return _map_finally(line, ctx)

    # Simple statements
    elif action == "RETURN":
        return _map_return(line, ctx)
    elif action == "BREAK":
        return [indent + "break"]
    elif action == "CONTINUE":
        return [indent + "continue"]
    elif action == "PASS":
        return [indent + "pass"]
    elif action == "PRINT":
        return _map_print(line, ctx)
    elif action == "SET":
        return _map_set(line, ctx)
    elif action == "INDEX_SET":
        return _map_index_set(line, ctx)
    elif action == "CALL":
        return _map_call(line, ctx)
    elif action == "GLOBAL":
        return _map_global(line, ctx)

    # Legacy standalone arithmetic
    elif action in ("ADD", "SUB", "MUL", "DIV"):
        op_map = {"ADD": "+", "SUB": "-", "MUL": "*", "DIV": "/"}
        return [indent + _legacy_map_arithmetic(line.get("args", []), op_map[action])]

    raise MapError(f"Unhandled ActionID: {action}")


# ============================================================
# Control Flow Mappers
# ============================================================

def _map_def(line: Dict, ctx: IndentContext) -> List[str]:
    args = line.get("args", [])
    if not args:
        raise MapError("DEF expects at least a function name")

    indent = ctx.get_indent()
    func_name = args[0].rstrip(":")

    if len(args) == 1:
        param_str = ""
    else:
        params = [p.rstrip(":") for p in args[1:]]
        param_str = ", ".join(params)

    ctx.indent()
    return [indent + f"def {func_name}({param_str}):"]


def _map_if(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    condition = map_expr(line["condition"])
    ctx.indent()
    return [indent + f"if {condition}:"]


def _map_elif(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    condition = map_expr(line["condition"])
    ctx.indent()
    return [indent + f"elif {condition}:"]


def _map_else(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    ctx.indent()
    return [indent + "else:"]


def _map_while(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    condition = map_expr(line["condition"])
    ctx.indent()
    return [indent + f"while {condition}:"]


def _map_for(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    var = line["var"]
    iterable = map_expr(line["iterable"])
    ctx.indent()
    return [indent + f"for {var} in {iterable}:"]


def _map_try(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    ctx.indent()
    return [indent + "try:"]


def _map_except(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    args = line.get("args", [])
    if args:
        exception = args[0].rstrip(":")
        exception_map = {
            "零除错误": "ZeroDivisionError",
            "其他错误": "Exception",
        }
        py_exception = exception_map.get(exception, exception)
        ctx.indent()
        return [indent + f"except {py_exception}:"]
    else:
        ctx.indent()
        return [indent + "except:"]


def _map_finally(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    ctx.indent()
    return [indent + "finally:"]


# ============================================================
# Simple Statement Mappers
# ============================================================

def _map_return(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    value = line.get("value")
    if value is None:
        return [indent + "return"]
    return [indent + f"return {map_expr(value)}"]


def _map_print(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    value_expr = line.get("value")
    if value_expr is None:
        return [indent + "print()"]
    return [indent + f"print({map_expr(value_expr)})"]


def _map_set(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    name = line["name"]
    value_expr = line["value"]

    if value_expr.get("type") == "Identifier" and value_expr["name"] in _KNOWN_CALL_FUNCTIONS:
        return [indent + f"{name} = {value_expr['name']}()"]

    return [indent + f"{name} = {map_expr(value_expr)}"]


def _map_index_set(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    container = line["container"]
    index = map_expr(line["index"])
    value = map_expr(line["value"])
    # Use helper so we raise a clear error if container is a str (parser fallback bug)
    return [indent + f"_catapillar_index_set({container!r}, {container}, {index}, {value})"]


def _map_call(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    func = line["func"]
    call_args = [map_expr(a) for a in line.get("call_args", [])]
    return [indent + f"{func}({', '.join(call_args)})"]


def _map_global(line: Dict, ctx: IndentContext) -> List[str]:
    indent = ctx.get_indent()
    names = ", ".join(line.get("names", []))
    return [indent + f"global {names}"]


# ============================================================
# Legacy Arithmetic (standalone 加/减/乘/除 actions)
# ============================================================

def _legacy_map_arithmetic(args: List[str], operator: str) -> str:
    if len(args) != 3:
        raise MapError(f"Arithmetic operation expects 3 arguments: result left right")
    result, left, right = args
    py_left = _legacy_to_py_value(left)
    py_right = _legacy_to_py_value(right)
    return f"{result} = {py_left} {operator} {py_right}"


def _legacy_to_py_value(symbol: str) -> str:
    if not symbol:
        return '""'
    if symbol in ("True", "真"):
        return "True"
    if symbol in ("False", "假"):
        return "False"
    if symbol == "None":
        return "None"
    try:
        float(symbol)
        return symbol
    except ValueError:
        pass
    if symbol.isidentifier():
        return symbol
    return f'"{symbol}"'
