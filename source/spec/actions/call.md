# Action：CALL（调用）

本文件定义 Catapillar v0.1 中的 **CALL** 动作。  
CALL 用于调用一个已存在的函数或可执行符号，并传入参数。

CALL 是 Catapillar v0.1 中 **第三个、也是最后一个基础 Action**，  
用于完成从“定义”到“执行”的闭环。

---

## 一、ActionID

CALL

AST 内部仅使用 ActionID：CALL  
不保留任何自然语言词。

---

## 二、语言绑定（唯一词规则）

在 Catapillar 中，每种自然语言 **只能对应一个唯一词**。

当前 v0.1 绑定如下：

- English（en）：call
    
- Chinese（zh）：调
    

不允许同义词，不允许别名。

---

## 三、基本语法形式

CALL 的标准写法为：

`call FUNC ARG1 ARG2 ... ARGN 调 FUNC ARG1 ARG2 ... ARGN`

说明：

- 不使用括号
    
- 不使用逗号
    
- 不使用引号
    
- 参数之间以空格分隔
    

---

## 四、参数规则

CALL 接受一个或多个参数。

1. FUNC
    
    - 被调用的函数或可执行符号名
        
    - 类型为 Atom
        
    - 必须位于参数列表的第一位
        
2. ARG
    
    - 传入函数的参数
        
    - 类型为 Atom
        
    - 参数数量不作限制
        

语言层不区分函数、方法或可调用对象。

---

## 五、AST 表示形式

一条 CALL 行在 AST 中的最小结构如下：

`type       : Line action     : CALL args       : ["func", "a", "b"] line_state : "~"`

其中：

- args[0] 为 FUNC
    
- args[1..n] 为调用参数
    

---

## 六、行态对 CALL 的影响

CALL 支持所有 LineState。

在 v0.1 中：

- `~`  
    普通调用行为
    
- `!`  
    调用行为 + 关键节点标记  
    可用于重要调用确认、日志或调试点
    
- `>` `<` `?`  
    不改变 CALL 的调用语义  
    仅影响行为流与 Segment 关系
    

---

## 七、Python 映射规则（规范级）

在 Python Mapper 中，CALL 的映射规则为：

- FUNC → Python 中的可调用对象
    
- ARG → 若已定义则作为变量，否则作为字面量
    

语义等价形式：

`func(a, b) func("hello") func(x, "world")`

参数顺序必须保持不变。

---

## 八、设计边界（v0.1）

CALL 在 v0.1 中：

- 不支持关键字参数
    
- 不支持嵌套调用
    
- 不支持返回值捕获
    

上述能力将在后续版本中通过扩展 Action 或组合规则引入。

---

## 附：感知注记（非语义层）

CALL 不是命令。

它是——  
**把已经存在的能力，轻轻唤醒。**

当你写下 CALL，  
世界里某个函数，开始回应你。