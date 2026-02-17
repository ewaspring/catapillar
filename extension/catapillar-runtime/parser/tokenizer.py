# parser/tokenizer.py
# Catapillar v0.1 tokenizer
# Responsibility: text lines -> tokenized line objects (no AST, no validation)

import warnings

from typing import List, Dict, Optional
from parser.errors import TokenizeError
from parser.errors import CatapillarWarning


LINE_STATES = {"~", ">", "<", "!", "?"}


def tokenize_line(line: str) -> Optional[Dict]:
    """
    Tokenize a single line of Catapillar source.

    Returns a dict with:
      - raw_action: str
      - raw_args: List[str]
      - line_state: str

    Returns None for empty or comment lines.
    """

    if not line:
        return None

    stripped = line.strip()

    # ignore empty lines
    if not stripped:
        return None

    # ignore comment lines (v0.1 simple rule)
    if stripped.startswith("#"):
        return None

    parts = stripped.split()

    # detect line_state at beginning (v0.1 rule)
    line_state = "~"
    if parts[0] in LINE_STATES:
        line_state = parts[0]
        parts = parts[1:]

    if not parts:
        return None

    raw_action = parts[0]
    raw_args = parts[1:]


    return {
        "raw_action": raw_action,
        "raw_args": raw_args,
        "line_state": line_state,
    }


def tokenize_source(source: str) -> List[Dict]:
    tokens: List[Dict] = []
    in_block_comment = False

    for lineno, line in enumerate(source.splitlines(), start=1):
        stripped = line.strip()

        # toggle block comment
        if stripped == "~~":
            in_block_comment = not in_block_comment
            continue

        # skip lines inside block comment
        if in_block_comment:
            continue

        # ⚠️ 行尾注释：警告 + 忽略
        if "#" in stripped and not stripped.startswith("#"):
            warnings.warn(
                f"Inline comments are not supported in Catapillar v0.1 (ignored) "
                f"[line {lineno}]",
                CatapillarWarning,
                stacklevel=2
            )
            stripped = stripped.split("#", 1)[0].rstrip()

        token = tokenize_line(stripped)   # ✅ 用处理后的行
        if token is not None:
            token["lineno"] = lineno
            tokens.append(token)

    return tokens


def tokenize_file(path: str) -> List[Dict]:
    """
    Read a .cat file and tokenize it.
    """
    with open(path, "r", encoding="utf-8") as f:
        source = f.read()
    return tokenize_source(source)
