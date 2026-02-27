package lang.catapillar

import com.intellij.psi.tree.IElementType

class CatapillarTokenType(debugName: String) : IElementType(debugName, CatapillarLanguage) {
    override fun toString(): String = "CatapillarTokenType." + super.toString()
}

object CatapillarTokenTypes {
    @JvmField val LINE_COMMENT = CatapillarTokenType("LINE_COMMENT")
    @JvmField val BLOCK_COMMENT = CatapillarTokenType("BLOCK_COMMENT")
    @JvmField val LINE_STATE = CatapillarTokenType("LINE_STATE")
    @JvmField val KEYWORD_DEF = CatapillarTokenType("KEYWORD_DEF")
    @JvmField val KEYWORD_CONTROL = CatapillarTokenType("KEYWORD_CONTROL")
    @JvmField val KEYWORD_ACTION = CatapillarTokenType("KEYWORD_ACTION")
    @JvmField val KEYWORD_OPERATOR = CatapillarTokenType("KEYWORD_OPERATOR")
    @JvmField val KEYWORD_END = CatapillarTokenType("KEYWORD_END")
    @JvmField val FUNCTION_NAME = CatapillarTokenType("FUNCTION_NAME")
    @JvmField val IDENTIFIER = CatapillarTokenType("IDENTIFIER")
    @JvmField val NUMBER = CatapillarTokenType("NUMBER")
    @JvmField val BOOLEAN = CatapillarTokenType("BOOLEAN")
    @JvmField val NULL = CatapillarTokenType("NULL")
    @JvmField val ARROW = CatapillarTokenType("ARROW")
    @JvmField val COLON = CatapillarTokenType("COLON")
    @JvmField val BAD_CHARACTER = CatapillarTokenType("BAD_CHARACTER")
}
