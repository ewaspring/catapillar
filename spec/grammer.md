# Catapillar Grammar v0.2 (Milestone 1)

This document defines the grammar rules for Catapillar v0.2.
It reflects the tokenizer, parser, and expression system after M1 completion.

---

## 1. Line Structure

Each non-empty line follows this structure:

    [LineState] [Emoji] Action Args...

- LineState: optional, at most one, **prefix only**
- Emoji: optional, semantic modifier (does not affect logic)
- Action: required keyword
- Args: zero or more atoms / expressions, separated by whitespace

---

## 2. LineState

    ~   Neutral (default)
    !   Strong
    ?   Tentative
    <   Return / Echo
    >   Segment boundary (structural)

---

## 3. Actions

### Control Flow

| ActionID | CN    | EN      | JP   |
|----------|-------|---------|------|
| DEF      | 定    | def     |      |
| IF       | 若    | if      |      |
| ELIF     | 又若  | elif    |      |
| ELSE     | 否则  | else    |      |
| WHILE    | 当    | while   |      |
| FOR      | 扭扭  | for     | 回す |
| BREAK    | 断    | break   |      |
| CONTINUE | 续    | continue|      |
| RETURN   | 回    | return  |      |
| TRY      | 试    | try     |      |
| EXCEPT   | 捕    | except  |      |
| FINALLY  | 终于  | finally |      |

### Assignment & I/O

| ActionID | CN | EN    |
|----------|----|-------|
| SET      | 置 | set   |
| PRINT    | 印 | print |
| CALL     | 调 | call  |
| PASS     | 空 | pass  |
| GLOBAL   | 全局 | global |

### Block End

| Canonical  | CN         | EN  | JP |
|------------|------------|-----|----|
| BLOCK_END  | 终/结束/完了 | end | 終 |

### FOR ... IN Keywords

| Canonical | CN | EN | JP |
|-----------|----|----|-----|
| IN        | 在 | in | 中  |

---

## 4. Expression System

Expressions follow a layered recursive descent grammar with
the following precedence (highest to lowest):

    Expression → OrExpr
    OrExpr     → AndExpr (("或" | "or") AndExpr)*
    AndExpr    → NotExpr (("且" | "and") NotExpr)*
    NotExpr    → ("非" | "not") NotExpr | CompareExpr
    CompareExpr→ AddExpr (CompareOp AddExpr)?
    AddExpr    → MulExpr (("+" | "-") MulExpr)*
    MulExpr    → UnaryExpr (("*" | "/") UnaryExpr)*
    UnaryExpr  → ("-" | "+") UnaryExpr | Primary
    Primary    → Literal | Identifier | ListLiteral | DictLiteral
               | "(" Expression ")" | Primary "[" Expression "]"

    Parentheses "(" Expression ")" are allowed only when the expression is
    compound (contains an operator, or is a call/index). Do not use (variable)
    or (literal); use the name or value without parentheses.

### Comparison Operators

| Catapillar | Python |
|------------|--------|
| 是         | ==     |
| 不是       | !=     |
| ==         | ==     |
| !=         | !=     |
| > < >= <=  | same   |

### Logical Operators

| Catapillar | Python | Precedence |
|------------|--------|------------|
| 非 / not   | not    | highest    |
| 且 / and   | and    | middle     |
| 或 / or    | or     | lowest     |

---

## 5. Literals

### Boolean

| Value | CN | EN    | JP |
|-------|----|-------|----|
| True  | 真 | true  | 真 |
| False | 假 | false | 偽 |

### None

| Value | CN | EN   | JP |
|-------|----|------|----|
| None  | 无 | none | 無 |

### String Literals

- **Default (no backticks):** Use bare words for strings. In value positions (print, set RHS, comparison RHS, list/dict elements), a bare word is a string.
  - 印 hello → print "hello"
  - 置 x quit → set x to string "quit"
  - 若 文本 是 quit → compare to string "quit"
- **Numeric as string:** Use `` only when you need a number as a string (e.g. the string "5" not the number 5).
  - 置 x ``5`` → x = "5"
  - 置 x 5 → x = 5
- **Optional:** ``value`` can still be used for any string (e.g. ``hello``) but is not the default.

### 印 / print (no parentheses)

**Do not use ( ) for 印/print.** The parser resolves each argument automatically:

- If a **variable with that name was declared above** (by 置, 扭扭, 定, or index assignment), it is treated as a variable and printed as `print(name)`.
- Otherwise it is treated as a **string or number** literal.

Examples:

- 置 x 5  →  then 印 x  →  prints 5 (variable)
- 印 y  (y not declared)  →  prints the string "y"
- 印 嵌套列表[0][1]  →  prints the value at that index (variable)
- 印 局部y  →  prints the variable 局部y

### Parentheses and variable resolution

- **Parentheses `( )` are only for expression grouping** — to override or clarify operator precedence. Do not use `(variable)`, `(literal)`, or parens around unary expressions.
- In **SET**, **FOR** (iterable), **IF/ELIF/WHILE** (condition), **CALL** (args), and **PRINT**, a bare identifier is resolved by declaration: if that name was declared above (by 置, 扭扭, 定, or index assignment), it is a variable; otherwise it is a string.

**When to use `( )` (correct):**

- `( expression )` — to change evaluation order. Nested `( ( expression ) )` is also allowed.

Examples:

- 印 (2 + 3) * 4          → 20 (add then multiply)
- 印 2 + 3 * 4            → 14 (normal precedence)
- 若 (a > 5 且 b < 10) 或 c: 印 ok 终
- 置 结果 非 (x 且 y)     → negate the result of (x 且 y)

**When NOT to use `( )` (wrong / unnecessary):**

| Situation            | Correct Catapillar              | Wrong / unnecessary              |
|----------------------|---------------------------------|----------------------------------|
| Function call        | 调 处理数据 值1 值2             | 调 处理数据(值1 值2)             |
| if / while condition | 若 a > 5 且 b < 10:             | 若 (a > 5 且 b < 10):            |
| for loop             | 扭扭 x 在 列表                  | 扭扭 (x) 在 列表                 |
| list / dict literal  | `[1 \| 2 \| 3]`, `映[年龄:18 \| 名字:小明]` | `[ (1 \| 2 \| 3) ]` |
| return value         | 回 a + b * c                    | 回 (a + b * c)                   |
| unary operator       | 非 真, -x                       | 非(真), (-x)                     |

### Number Literals

    42    3.14    -5    +5

---

## 6. Data Structures

### List Literal

Elements separated by `|` inside `[]`:

    [1 | 2 | 3]
    [hello | world]
    [[1 | 2] | [3 | 4]]
    []

### Dict Literal

Key-value pairs with `:` or `：`, separated by `|`.
Optional MAP_PREFIX (映 / map / 辞):

    映[key: 1 | key2: 2]
    [key: 1 | key2: 2]

### Index Access

    container[index]
    nested[0][1]

### Index Assignment

    置 container[index] value

---

## 7. Scope Rules

Two scope levels:

1. **Global Scope** — top-level
2. **Function Local Scope** — inside `DEF`

`IF / WHILE / FOR / TRY` blocks do **not** create new scopes.

Lookup order: Local → Global.

`GLOBAL` (全局 / global / 全) declares explicit global mutation.

---

## 8. Emoji Prefix

An emoji at line start acts as a semantic modifier:

    🌸 印 樱花
    (*^▽^*) 印 kawaii

The emoji is stored in the AST but does not affect execution.

---

## 9. Comments

### Single-line

    # comment text

### Multi-line

    ~~
    block comment
    ~~
