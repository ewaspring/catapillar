# mapper/python_mapper.py
# Catapillar v0.1 Python mapper
# Responsibility: AST -> Python source code

from typing import Dict, List


class MapError(Exception):
    pass


def map_program(program: Dict) -> str:
    """
    Map AST Program node to Python source code.
    """
    if program.get("type") != "Program":
        raise MapError("Root node must be Program")

    lines: List[str] = []

    for flow in program.get("flows", []):
        lines.extend(map_flow(flow))

    return "\n".join(lines)



def map_flow(flow: Dict) -> List[str]:
    """
    Map Flow node.
    """
    if flow.get("type") != "Flow":
        raise MapError("Expected Flow node")

    lines: List[str] = []

    for segment in flow.get("segments", []):
        lines.extend(map_segment(segment))

    return lines


def map_segment(segment: Dict) -> List[str]:
    """
    Map Segment node.
    """
    if segment.get("type") != "Segment":
        raise MapError("Expected Segment node")

    lines: List[str] = []

    for line in segment.get("lines", []):
        py_line = map_line(line)
        if py_line:
            lines.append(py_line)

    return lines


def map_line(line: Dict) -> str:
    """
    Map Line node to a single Python line.
    """
    if line.get("type") != "Line":
        raise MapError("Expected Line node")

    action = line.get("action")
    args = line.get("args", [])
    line_state = line.get("line_state", "~")

    if action == "PRINT":
        return map_print(args)

    if action == "SET":
        return map_set(args)

    if action == "CALL":
        return map_call(args)

    raise MapError(f"Unhandled ActionID: {action}")


def map_print(args: List[str]) -> str:
    py_args = []

    for arg in args:
        if is_variable(arg):
            py_args.append(arg)
        else:
            py_args.append(f'"{arg}"')

    return f"print({', '.join(py_args)})"


def map_set(args: List[str]) -> str:
    if len(args) != 2:
        raise MapError("SET expects exactly 2 arguments")

    name, value = args

    if not is_valid_identifier(name):
        raise MapError(f"Invalid variable name: {name}")

    if is_variable(value):
        py_value = value
    else:
        py_value = f'"{value}"'

    return f"{name} = {py_value}"


def map_call(args: List[str]) -> str:
    if not args:
        raise MapError("CALL expects at least 1 argument")

    func = args[0]
    call_args = args[1:]

    py_args = []

    for arg in call_args:
        if is_variable(arg):
            py_args.append(arg)
        else:
            py_args.append(f'"{arg}"')

    return f"{func}({', '.join(py_args)})"


def is_valid_identifier(name: str) -> bool:
    return name.isidentifier()


def is_variable(symbol: str) -> bool:
    """
    v0.1 rule:
    If symbol is a valid Python identifier, treat it as variable.
    Otherwise treat as literal.
    """
    return symbol.isidentifier()
