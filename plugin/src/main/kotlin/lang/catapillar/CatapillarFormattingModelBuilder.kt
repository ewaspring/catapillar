package lang.catapillar

import com.intellij.formatting.*
import com.intellij.lang.ASTNode
import com.intellij.psi.TokenType
import com.intellij.psi.formatter.common.AbstractBlock

class CatapillarFormattingModelBuilder : FormattingModelBuilder {
    override fun createModel(element: com.intellij.psi.PsiElement, settings: com.intellij.psi.codeStyle.CodeStyleSettings): FormattingModel {
        val file = element.containingFile ?: throw IllegalStateException("element has no containing file")
        return FormattingModelProvider.createFormattingModelForPsiFile(
            file,
            CatapillarBlock(file.node, Wrap.createWrap(WrapType.NONE, false), null, SpacingBuilder(settings, CatapillarLanguage)),
            settings
        )
    }
}

class CatapillarBlock(
    node: ASTNode,
    private val wrap: Wrap?,
    private val alignment: Alignment?,
    private val spacingBuilder: SpacingBuilder
) : AbstractBlock(node, wrap, alignment) {
    override fun buildChildren(): List<Block> {
        val list = mutableListOf<Block>()
        var child = myNode.firstChildNode
        while (child != null) {
            if (child.elementType != TokenType.WHITE_SPACE) {
                list.add(CatapillarBlock(child, null, null, spacingBuilder))
            }
            child = child.treeNext
        }
        return list
    }
    override fun getSpacing(child1: Block?, child2: Block): Spacing? = null
    override fun isLeaf(): Boolean = myNode.firstChildNode == null
}
