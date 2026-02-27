# Action：SET（设定）

本文件定义 Catapillar v0.1 中的 **SET** 动作。  
SET 用于在当前作用域中 **定义或更新一个符号的值**。

SET 是 Catapillar 中 **第二个基础 Action**，  
用于支撑变量、状态与后续行为的引用。

---

## 一、ActionID

SET

AST 内部仅使用 ActionID：SET  
不保留任何自然语言词。

---

## 二、语言绑定（唯一词规则）

在 Catapillar 中，每种自然语言 **只能对应一个唯一词**。

当前 v0.1 绑定如下：

- English（en）：set
    
- Chinese（zh）：置
    

不允许同义词，不允许别名。

---

## 三、基本语法形式

SET 的标准写法为：

`set NAME VALUE 置 NAME VALUE`

说明：

- 不使用等号 `=`
    
- 不使用引号
    
- 参数之间以空格分隔
    
- NAME 必须是一个 Atom
    

---

## 四、参数规则

SET 接受两个参数：

1. NAME
    
    - 被定义的符号名
        
    - 类型为 Atom
        
2. VALUE
    
    - 被赋予的值
        
    - 类型为 Atom
        

语言层不区分数字、字符串或变量。

示例（语义说明）：

`set x 10        → 定义 x set name hello → 定义 name set x y         → x 的值指向 y 的当前值`

---

## 五、AST 表示形式

一条 SET 行在 AST 中的最小结构如下：

`type       : Line action     : SET args       : ["x", "10"] line_state : "~"`

NAME 永远位于 args[0]，  
VALUE 永远位于 args[1]。

---

## 六、行态对 SET 的影响

SET 支持所有 LineState。

在 v0.1 中：

- `~`  
    普通设定行为
    
- `!`  
    设定行为 + 关键节点标记  
    可用于状态确认或调试断点
    
- `>` `<` `?`  
    不改变 SET 的赋值语义  
    仅影响行为流结构
    

---

## 七、Python 映射规则（规范级）

在 Python Mapper 中，SET 的映射规则为：

- NAME → Python 变量名
    
- VALUE → 若已定义则作为变量，否则作为字面量
    

语义等价形式：

`x = 10 name = "hello" x = y`

---

## 八、设计边界（v0.1）

SET 在 v0.1 中：

- 不支持解构赋值
    
- 不支持表达式计算
    
- 不支持多重赋值
    

上述能力将在后续版本中通过扩展规则引入。

---

## 附：感知注记（非语义层）

SET 不只是“赋值”。

它是——  
**在世界里放下一枚可被再次呼唤的名字。**

从这一刻起，  
这个符号开始拥有记忆。