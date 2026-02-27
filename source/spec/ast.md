# Catapillar AST v0.1

# English
## Core Units

### Program
- consists of multiple Flows

### Flow
- consists of ordered Segments

### Segment
- consists of ordered Lines

### Line
- action: ActionID
- args: list of Atom
- line_state: LineState

## ActionID

ActionID is a canonical identifier, language-independent.

Example:
- PRINT
- SET
- CALL

## Atom

Atom is an unquoted symbol.

- If atom is defined in scope → variable
- Else → literal symbol

## LineState

One of:
- ~ Continue
- > Advance
- < Back
- ! Commit
- ? Await

# Chinese
# Catapillar 抽象语法树（AST）规范 v0.1

本文件定义 Catapillar 语言的唯一语义结构。  
所有 parser、mapper、编辑器插件 **必须** 以此为准。

Catapillar 是一门 **行为序列 DSL**，  
不依赖缩进、括号或代码块，而以 **行态（LineState）** 驱动执行流。

---

## 一、核心结构层级

### Program（程序）

- 一个 `.cat` 文件对应一个 Program
- Program 由一个或多个 Flow 组成

### Flow（行为流）

- 表示一段连续的行为过程
- Flow 由若干个 Segment 按顺序组成

### Segment（行为节）

- 行为的阶段性分组
- Segment 由若干个 Line 组成
- Segment 的边界由行态（LineState）决定

### Line（行为行）

Line 是 Catapillar 的最小执行单位。

每一行 **必须** 包含以下字段：

- `action`：ActionID  
- `args`：Atom 列表  
- `line_state`：LineState  

---

## 二、ActionID（动作标识）

ActionID 是 **与自然语言无关的抽象动作标识**。

- AST 内部只允许使用 ActionID
- 不允许直接使用自然语言词作为语义判断依据
- 自然语言词仅在 parser 阶段映射为 ActionID

### v0.1 可用 ActionID

- `PRINT`
- `SET`
- `CALL`

---

## 三、Atom（原子参数）

Atom 是 **不使用引号的符号单元**。

- Catapillar 语言层不区分字符串与变量
- Atom 的最终含义由 mapper 根据上下文决定

### 解释规则（v0.1）

1. 若 Atom 在当前作用域中已定义 → 变量  
2. 否则 → 字面量符号（literal）

### 示例

```catapillar
print hello
print x
```

## 四、LineState（行态）

LineState 用于描述一行行为在执行流中的位置与关系。  
行态不定义语法结构，而定义**行为之间的时间与阶段关系**。

### v0.1 支持的行态

| 符号 | 名称 | 含义 |
|----|----|----|
| `~` | Continue | 当前行为节继续 |
| `>` | Advance | 进入下一行为节 |
| `<` | Back | 回看或引用上一节 |
| `!` | Commit | 关键节点，必须成立 |
| `?` | Await | 等待外部输入 |

---

## 五、Line 的标准结构

Catapillar 中的每一行，必须遵循统一的结构形式。

```text
ACTION ARG1 ARG2 ... ARGN [LINE_STATE]
```

## 结构说明

* **ACTION**
抽象动作标识（ActionID），由 parser 从自然语言映射得到。
AST 内部仅保留 ActionID，不保留自然语言词。

* **ARG**
参数，类型为 Atom，不使用引号。
Atom 的具体含义（变量 / 字面量）由 mapper 根据作用域决定。

* **LINE_STATE**
行态，用于描述行为在执行流中的位置关系。
若省略，则默认使用 ~（Continue）。

---

## 六、AST 最小结构示意

以下示例展示一行 Catapillar 代码在 AST 中的最小表示形式。

```json
{
  "type": "Line",
  "action": "PRINT",
  "args": ["hello"],
  "line_state": "~"
}
```
该结构是所有 parser、mapper、编辑器插件的最小依赖单元。

---

七、设计原则（v0.1）

Catapillar v0.1 遵循以下设计原则：

1. 不依赖缩进 
2. 不使用引号 
3. 不使用括号 
4. 一行即一个行为 
5. 行态驱动执行流 
6. AST 是唯一语义真相源
---

## 八、v0.1 明确不包含的内容

在 v0.1 阶段，Catapillar 刻意不包含以下能力：
* 类型系统

* 控制结构语法（if / loop）

* 表达式嵌套

* 宿主语言绑定（Python / JavaScript）

上述能力将在后续版本中以分层方式逐步引入。