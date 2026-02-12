# Catapillar Grammar v0.1

This document defines the **frozen grammar rules** for Catapillar v0.1.
It reflects the current behavior of the tokenizer and parser.
Anything not listed here is considered **unsupported**.

---

## 1. Line Structure

Each non-empty line follows this structure:

    [LineState] Action Args...

- LineState: optional, at most one, **prefix only**
- Action: required
- Args: zero or more atoms, separated by whitespace

---

## 2. LineState

LineState modifies the **entire line**.
It must appear **at the beginning of the line**.

Supported LineStates:

    ~   Neutral (default)
    !   Strong
    ?   Tentative
    <   Return / Echo
    >   Segment boundary (structural)

Rules:
- LineState can only appear at line start
- Only one LineState per line
- Postfix LineState is not supported

---

## 3. Actions (v0.1 frozen)

The following Action IDs are recognized by the parser:

    SET
    PRINT
    CALL

Action keywords may have multiple surface forms
(e.g. English / Chinese), resolved at tokenizer level.

---

## 4. Atoms

- Args are **unquoted symbols** (Atoms)
- No string literals
- No escaping
- Interpretation is deferred to mapper/runtime

---

## 5. Comments

### 5.1 Single-line comments

    # comment text

Rules:
- `#` starts a comment until end of line
- Can appear at line start or inline
- Stripped at tokenizer level
- Not included in AST

### 5.2 Multi-line comments

    ~~
    multi-line comment
    ignored by tokenizer
    ~~

Rules:
- `~~` must occupy a full line
- Must appear in pairs
- Content between is completely ignored
- No nesting support

---

## 6. Explicitly Unsupported in v0.1

The following features are **not supported**:

- String literals
- Escape sequences
- Nested blocks
- Inline block comments
- Postfix LineState
- Multi-character operators
- Expression evaluation

---

## 7. Version Boundary

This grammar is **frozen for v0.1**.
Any extension must target v0.2 or later.
