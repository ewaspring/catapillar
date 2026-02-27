package lang.catapillar

import com.intellij.lexer.Lexer
import com.intellij.openapi.editor.DefaultLanguageHighlighterColors
import com.intellij.openapi.editor.colors.TextAttributesKey
import com.intellij.openapi.editor.colors.TextAttributesKey.createTextAttributesKey
import com.intellij.openapi.fileTypes.SyntaxHighlighterBase
import com.intellij.psi.tree.IElementType

object CatapillarSyntaxHighlighter : SyntaxHighlighterBase() {
    val LINE_COMMENT = createTextAttributesKey("CATAPILLAR_LINE_COMMENT", DefaultLanguageHighlighterColors.LINE_COMMENT)
    val BLOCK_COMMENT = createTextAttributesKey("CATAPILLAR_BLOCK_COMMENT", DefaultLanguageHighlighterColors.BLOCK_COMMENT)
    val LINE_STATE = createTextAttributesKey("CATAPILLAR_LINE_STATE", DefaultLanguageHighlighterColors.OPERATION_SIGN)
    val KEYWORD_DEF = createTextAttributesKey("CATAPILLAR_KEYWORD_DEF", DefaultLanguageHighlighterColors.KEYWORD)
    val KEYWORD_CONTROL = createTextAttributesKey("CATAPILLAR_KEYWORD_CONTROL", DefaultLanguageHighlighterColors.KEYWORD)
    val KEYWORD_ACTION = createTextAttributesKey("CATAPILLAR_KEYWORD_ACTION", DefaultLanguageHighlighterColors.KEYWORD)
    val KEYWORD_OPERATOR = createTextAttributesKey("CATAPILLAR_KEYWORD_OPERATOR", DefaultLanguageHighlighterColors.OPERATION_SIGN)
    val KEYWORD_END = createTextAttributesKey("CATAPILLAR_KEYWORD_END", DefaultLanguageHighlighterColors.KEYWORD)
    val FUNCTION_NAME = createTextAttributesKey("CATAPILLAR_FUNCTION_NAME", DefaultLanguageHighlighterColors.FUNCTION_DECLARATION)
    val IDENTIFIER = createTextAttributesKey("CATAPILLAR_IDENTIFIER", DefaultLanguageHighlighterColors.IDENTIFIER)
    val NUMBER = createTextAttributesKey("CATAPILLAR_NUMBER", DefaultLanguageHighlighterColors.NUMBER)
    val BOOLEAN = createTextAttributesKey("CATAPILLAR_BOOLEAN", DefaultLanguageHighlighterColors.CONSTANT)
    val NULL = createTextAttributesKey("CATAPILLAR_NULL", DefaultLanguageHighlighterColors.CONSTANT)
    val ARROW = createTextAttributesKey("CATAPILLAR_ARROW", DefaultLanguageHighlighterColors.OPERATION_SIGN)
    val COLON = createTextAttributesKey("CATAPILLAR_COLON", DefaultLanguageHighlighterColors.DOT)

    override fun getHighlightingLexer(): Lexer = CatapillarLexer()

    override fun getTokenHighlights(tokenType: IElementType): Array<TextAttributesKey> = when (tokenType) {
        CatapillarTokenTypes.LINE_COMMENT -> pack(LINE_COMMENT)
        CatapillarTokenTypes.BLOCK_COMMENT -> pack(BLOCK_COMMENT)
        CatapillarTokenTypes.LINE_STATE -> pack(LINE_STATE)
        CatapillarTokenTypes.KEYWORD_DEF -> pack(KEYWORD_DEF)
        CatapillarTokenTypes.KEYWORD_CONTROL -> pack(KEYWORD_CONTROL)
        CatapillarTokenTypes.KEYWORD_ACTION -> pack(KEYWORD_ACTION)
        CatapillarTokenTypes.KEYWORD_OPERATOR -> pack(KEYWORD_OPERATOR)
        CatapillarTokenTypes.KEYWORD_END -> pack(KEYWORD_END)
        CatapillarTokenTypes.FUNCTION_NAME -> pack(FUNCTION_NAME)
        CatapillarTokenTypes.IDENTIFIER -> pack(IDENTIFIER)
        CatapillarTokenTypes.NUMBER -> pack(NUMBER)
        CatapillarTokenTypes.BOOLEAN -> pack(BOOLEAN)
        CatapillarTokenTypes.NULL -> pack(NULL)
        CatapillarTokenTypes.ARROW -> pack(ARROW)
        CatapillarTokenTypes.COLON -> pack(COLON)
        else -> emptyArray()
    }
}
