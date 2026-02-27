package lang.catapillar

import com.intellij.lexer.LexerBase
import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType

/**
 * Simple regex-based lexer for Catapillar syntax highlighting.
 * Matches line comment, block comment, line state, keywords, identifiers, numbers, etc.
 */
class CatapillarLexer : LexerBase() {
    private var buffer: CharSequence = ""
    private var startOffset = 0
    private var endOffset = 0
    private var tokenStart = 0
    private var tokenEnd = 0
    private var tokenType: IElementType? = null
    private var lineStart = 0

    override fun start(buffer: CharSequence, startOffset: Int, endOffset: Int, initialState: Int) {
        this.buffer = buffer
        this.startOffset = startOffset
        this.endOffset = endOffset
        this.lineStart = startOffset
        this.tokenStart = startOffset
        this.tokenEnd = startOffset
        this.tokenType = null
        advance()
    }

    override fun getState(): Int = 0
    override fun getTokenType(): IElementType? = tokenType
    override fun getTokenStart(): Int = tokenStart
    override fun getTokenEnd(): Int = tokenEnd
    override fun getBufferSequence(): CharSequence = buffer
    override fun getBufferEnd(): Int = endOffset

    override fun advance() {
        tokenStart = tokenEnd
        if (tokenEnd >= endOffset) {
            tokenType = null
            return
        }
        val rest = buffer.subSequence(tokenEnd, endOffset).toString()
        // Whitespace
        val wsMatch = Regex("^\\s+").find(rest)
        if (wsMatch != null) {
            tokenEnd = tokenStart + wsMatch.value.length
            tokenType = TokenType.WHITE_SPACE
            return
        }
        val trimmedLine = rest.lines().firstOrNull()?.trimStart() ?: rest

        // Line comment
        if (trimmedLine.startsWith("#")) {
            val eol = nextLineEnd(tokenEnd)
            tokenEnd = eol
            tokenType = CatapillarTokenTypes.LINE_COMMENT
            return
        }
        // Block comment line ~~
        if (trimmedLine == "~~" || trimmedLine.startsWith("~~")) {
            val eol = nextLineEnd(tokenEnd)
            tokenEnd = eol
            tokenType = CatapillarTokenTypes.BLOCK_COMMENT
            return
        }
        // Line state at line start
        val lineWsMatch = Regex("^\\s*").find(rest)!!
        val afterWs = rest.drop(lineWsMatch.value.length)
        if (afterWs.isNotEmpty() && afterWs[0] in "~><!?") {
            tokenEnd = tokenStart + lineWsMatch.value.length + 1
            tokenType = CatapillarTokenTypes.LINE_STATE
            return
        }
        // Arrow
        val arrowMatch = Regex("->|<-").find(rest)
        if (arrowMatch != null && arrowMatch.range.first == 0) {
            tokenEnd = tokenStart + arrowMatch.value.length
            tokenType = CatapillarTokenTypes.ARROW
            return
        }
        // Skip leading whitespace for word match
        val wordStart = lineWsMatch.value.length
        val wordRest = rest.drop(wordStart)
        val wordMatch = Regex("^[\\w\\u4e00-\\u9fff]+").find(wordRest)
        if (wordMatch != null) {
            val word = wordMatch.value
            tokenEnd = tokenStart + wordStart + word.length
            tokenType = when {
                word in DEF_KW -> CatapillarTokenTypes.KEYWORD_DEF
                word in CONTROL_KW -> CatapillarTokenTypes.KEYWORD_CONTROL
                word in ACTION_KW -> CatapillarTokenTypes.KEYWORD_ACTION
                word in OPERATOR_KW -> CatapillarTokenTypes.KEYWORD_OPERATOR
                word in END_KW -> CatapillarTokenTypes.KEYWORD_END
                word in BOOLEAN_VALS -> CatapillarTokenTypes.BOOLEAN
                word in NULL_VALS -> CatapillarTokenTypes.NULL
                word.matches(Regex("^-?\\d+(\\.\\d+)?")) -> CatapillarTokenTypes.NUMBER
                else -> CatapillarTokenTypes.IDENTIFIER
            }
            return
        }
        // Colon
        if (wordRest.startsWith(":") || wordRest.startsWith("：")) {
            tokenEnd = tokenStart + wordStart + 1
            tokenType = CatapillarTokenTypes.COLON
            return
        }
        // Single char / rest of line as identifier or skip
        val anyWord = Regex("^[\\w\\u4e00-\\u9fff]+").find(rest)
        if (anyWord != null) {
            tokenEnd = tokenStart + anyWord.value.length
            tokenType = CatapillarTokenTypes.IDENTIFIER
            return
        }
        val one = rest.take(1)
        tokenEnd = tokenStart + one.length
        tokenType = CatapillarTokenTypes.BAD_CHARACTER
    }

    private fun nextLineEnd(from: Int): Int {
        var i = from
        while (i < endOffset && buffer[i] != '\n') i++
        if (i < endOffset) i++
        return i
    }

    companion object {
        private val DEF_KW = setOf("定", "def")
        private val CONTROL_KW = setOf(
            "若", "if", "又若", "elif", "否则", "else", "当", "while", "扭扭", "for", "回す",
            "断", "break", "续", "continue", "回", "return", "试", "try", "捕", "except",
            "终于", "finally", "空", "pass", "在", "in", "中"
        )
        private val ACTION_KW = setOf("印", "print", "置", "set", "调", "call", "全局", "global", "全")
        private val OPERATOR_KW = setOf("加", "add", "减", "sub", "乘", "mul", "除", "div",
            "是", "不是", "或", "且", "非", "not")
        private val END_KW = setOf("终", "end", "结束", "完了", "終")
        private val BOOLEAN_VALS = setOf("True", "False", "true", "false", "真", "假", "偽")
        private val NULL_VALS = setOf("无", "none", "無")
    }
}
