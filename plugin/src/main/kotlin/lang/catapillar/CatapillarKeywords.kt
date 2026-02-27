package lang.catapillar

/**
 * Keyword data for completion and hover. Mirrors extension/src/keywords.ts.
 */
data class KeywordInfo(
    val actionId: String,
    val forms: List<String>,
    val descriptionEn: String,
    val detailEn: String,
    val category: String,
    val opensBlock: Boolean
)

object CatapillarKeywords {
    val KEYWORDS = listOf(
        KeywordInfo("PRINT", listOf("print", "印"), "Print output", "Print values to standard output.", "action", false),
        KeywordInfo("SET", listOf("set", "置"), "Set variable", "Assign a value to a variable.", "action", false),
        KeywordInfo("CALL", listOf("call", "调"), "Call function", "Call a defined function.", "action", false),
        KeywordInfo("DEF", listOf("def", "定"), "Define function", "Define a new function.", "control", true),
        KeywordInfo("IF", listOf("if", "若"), "If condition", "Conditional branch.", "control", true),
        KeywordInfo("ELIF", listOf("elif", "又若"), "Else if", "Else-if branch.", "control", true),
        KeywordInfo("ELSE", listOf("else", "否则"), "Else branch", "Else branch.", "control", true),
        KeywordInfo("WHILE", listOf("while", "当"), "While loop", "Loop while condition is true.", "control", true),
        KeywordInfo("FOR", listOf("for", "扭扭", "回す"), "For loop", "Iterate over a sequence.", "control", true),
        KeywordInfo("BREAK", listOf("break", "断"), "Break loop", "Break out of the current loop.", "control", false),
        KeywordInfo("CONTINUE", listOf("continue", "续"), "Continue loop", "Skip to next iteration.", "control", false),
        KeywordInfo("RETURN", listOf("return", "回"), "Return value", "Return a value from a function.", "control", false),
        KeywordInfo("TRY", listOf("try", "试"), "Try block", "Begin a try block.", "control", true),
        KeywordInfo("EXCEPT", listOf("except", "捕"), "Catch exception", "Catch an exception.", "control", true),
        KeywordInfo("FINALLY", listOf("finally", "终于"), "Finally block", "Finally block.", "control", true),
        KeywordInfo("PASS", listOf("pass", "空"), "Empty statement", "An empty statement.", "control", false),
        KeywordInfo("GLOBAL", listOf("global", "全局", "全"), "Global declaration", "Declare names as global.", "control", false),
        KeywordInfo("ADD", listOf("add", "加"), "Addition", "Add two values.", "arithmetic", false),
        KeywordInfo("SUB", listOf("sub", "减"), "Subtraction", "Subtract two values.", "arithmetic", false),
        KeywordInfo("MUL", listOf("mul", "乘"), "Multiplication", "Multiply two values.", "arithmetic", false),
        KeywordInfo("DIV", listOf("div", "除"), "Division", "Divide two values.", "arithmetic", false),
    )
    val STRUCT_END = listOf("end", "结束", "完了", "终", "終")
    val LINE_STATES = listOf("~", ">", "<", "!", "?")
    val IN_KEYWORDS = listOf("in", "在", "中")
    val OPERATOR_KEYWORDS = listOf("是", "不是", "或", "且", "非", "not")
    val NULL_LITERALS = listOf("无", "none", "無")
    val BOOLEAN_LITERALS = listOf("True", "False", "true", "false", "真", "假", "偽")

    fun allForms(): Set<String> = KEYWORDS.flatMap { it.forms }.toSet() +
            STRUCT_END + LINE_STATES + IN_KEYWORDS + OPERATOR_KEYWORDS + NULL_LITERALS + BOOLEAN_LITERALS

    fun findByForm(form: String): KeywordInfo? = KEYWORDS.find { form in it.forms }
}
