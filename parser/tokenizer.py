# parser/tokenizer.py
# Catapillar v0.1 tokenizer
# Responsibility: text lines -> tokenized line objects (no AST, no validation)

import warnings
import unicodedata
import re

from typing import List, Dict, Optional
from parser.errors import TokenizeError
from parser.errors import CatapillarWarning


LINE_STATES = {"~", ">", "<", "!", "?"}

STRUCTURAL_CHARS = set("[]|()")
COLON_CHARS = {":", "："}
MAP_PREFIXES = {"映", "map", "辞"}

_EMOJI_RANGES = [
    (0x1F600, 0x1F64F), (0x1F300, 0x1F5FF), (0x1F680, 0x1F6FF),
    (0x1F1E0, 0x1F1FF), (0x2600, 0x26FF),   (0x2700, 0x27BF),
    (0x1F900, 0x1F9FF), (0x1FA00, 0x1FA6F), (0x1FA70, 0x1FAFF),
    (0x231A, 0x231B),   (0x23E9, 0x23F3),   (0x23F8, 0x23FA),
    (0x25AA, 0x25AB),   (0x25B6, 0x25C0),   (0x25FB, 0x25FE),
    (0x2934, 0x2935),   (0x2B05, 0x2B07),   (0x2B1B, 0x2B1C),
    (0x200D, 0x200D),   (0xFE0F, 0xFE0F),
]


def is_emoji(token: str) -> bool:
    """Check if a token is an emoji or kaomoji."""
    if not token:
        return False
    # Kaomoji: parenthesized face-like patterns
    if re.match(r'^\(.*\)$', token) and len(token) >= 3:
        inner = token[1:-1]
        if any(unicodedata.category(c).startswith("S") or c in "▽△^*><_・ω゜" for c in inner):
            return True
    cp = ord(token[0])
    for start, end in _EMOJI_RANGES:
        if start <= cp <= end:
            return True
    if unicodedata.category(token[0]) == "So":
        return True
    return False


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

    # Detect emoji prefix: emoji at line start is a semantic modifier
    emoji_prefix = None
    if is_emoji(raw_action):
        emoji_prefix = raw_action
        if not raw_args:
            return None
        raw_action = raw_args[0]
        raw_args = raw_args[1:]

    result = {
        "raw_action": raw_action,
        "raw_args": raw_args,
        "line_state": line_state,
    }
    if emoji_prefix is not None:
        result["emoji_prefix"] = emoji_prefix

    return result


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


# ============================================================
# Expression-level tokenizer
# Called by the parser when it needs finer-grained tokens
# within a line's raw_args.
# ============================================================

def tokenize_expression(raw_args: List[str]) -> List[str]:
    """
    Split raw_args into expression tokens.
    Handles structural characters: [ ] | ( ) : ：
    Handles backtick-wrapped strings: ``value``
    """
    joined = " ".join(raw_args)
    return _split_expr_text(joined)


def _split_expr_text(text: str) -> List[str]:
    """Tokenize expression text, respecting backtick strings."""
    tokens = []
    i = 0
    current = ""

    while i < len(text):
        ch = text[i]

        # Backtick-wrapped strings ``value``
        if ch == '`' and i + 1 < len(text) and text[i + 1] == '`':
            if current.strip():
                tokens.extend(_split_structural(current.strip()))
                current = ""
            end = text.find('``', i + 2)
            if end != -1:
                tokens.append(text[i:end + 2])
                i = end + 2
                continue
            current += ch
            i += 1
            continue

        if ch in (' ', '\t'):
            if current.strip():
                tokens.extend(_split_structural(current.strip()))
                current = ""
            i += 1
            continue

        current += ch
        i += 1

    if current.strip():
        tokens.extend(_split_structural(current.strip()))

    return tokens


def _split_structural(token: str) -> List[str]:
    """
    Split a single token at structural character boundaries.
    E.g. "[1" → ["[", "1"], "映[" → ["映", "["], "key:" → ["key", ":"]
    """
    if not token:
        return []
    result = []
    current = ""
    for ch in token:
        if ch in STRUCTURAL_CHARS or ch in COLON_CHARS:
            if current:
                result.append(current)
                current = ""
            result.append(ch)
        else:
            current += ch
    if current:
        result.append(current)
    return result
