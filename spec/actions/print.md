# Action：PRINT（输出）

本文件定义 Catapillar v0.1 中的 **PRINT** 动作。  
PRINT 用于将一个或多个 Atom 输出到当前宿主环境。

PRINT 是 Catapillar 中 **第一个必须实现的基础 Action**。

---

## 一、ActionID

PRINT

AST 内部仅使用 ActionID：PRINT  
不保留任何自然语言词。

---

## 二、语言绑定（唯一词规则）

在 Catapillar 中，每种自然语言 **只能对应一个唯一词**。

当前 v0.1 绑定如下：

- English（en）：print
    
- Chinese（zh）：印
    

不允许同义词，不允许别名。

---

## 三、基本语法形式

PRINT 的标准写法为：

`print ARG1 ARG2 ... ARGN 印 ARG1 ARG2 ... ARGN`

说明：

- 不使用括号
    
- 不使用逗号
    
- 不使用引号
    
- 参数之间以空格分隔
    

---

## 四、参数（Atom）规则

PRINT 接受一个或多个 Atom 作为参数。

Atom 的解释规则如下：

1. 若 Atom 在当前作用域中已定义 → 变量
    
2. 否则 → 字面量符号（literal）
    

语言层不区分字符串与变量。

示例（语义说明）：

`print hello      → 输出字面量 "hello" print x          → 输出变量 x print hello x    → 输出 "hello" 与 x`

---

## 五、AST 表示形式

一条 PRINT 行在 AST 中的最小结构如下：

`type       : Line action     : PRINT args       : ["hello"] line_state : "~"`

多参数示例：

`args : ["hello", "x"]`

---

## 六、行态对 PRINT 的影响

PRINT 支持所有 LineState，但在 v0.1 中：

- `~`  
    普通输出行为
    
- `!`  
    输出行为 + 关键节点标记  
    可用于日志、调试、状态确认
    
- `>` `<` `?`  
    不改变 PRINT 本身的输出语义  
    仅影响行为流与 Segment 关系
    

---

## 七、Python 映射规则（规范级）

在 Python Mapper 中，PRINT 的映射规则为：

- Atom 为变量 → 直接作为参数
    
- Atom 为字面量 → 映射为字符串字面量
    

语义等价形式：

`print("hello") print(x) print("hello", x)`

PRINT 的参数顺序必须保持不变。

---

## 八、设计边界（v0.1）

PRINT 在 v0.1 中：

- 不支持格式化字符串
    
- 不支持表达式求值
    
- 不支持内联函数调用
    

上述能力将在后续版本中通过新 Action 或扩展规则引入。