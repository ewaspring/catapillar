package lang.catapillar

import com.intellij.extapi.psi.ASTWrapperPsiElement
import com.intellij.lang.ASTNode
import com.intellij.lang.PsiBuilder
import com.intellij.lang.PsiParser
import com.intellij.psi.PsiElement
import com.intellij.psi.impl.source.tree.LeafPsiElement
import com.intellij.psi.tree.IFileElementType
import com.intellij.psi.tree.IElementType
import com.intellij.psi.tree.TokenSet

val CATAPILLAR_FILE = IFileElementType(CatapillarLanguage)
val CATAPILLAR_ROOT = CatapillarTokenType("ROOT")

class CatapillarRootElement(node: ASTNode) : ASTWrapperPsiElement(node)

class CatapillarPsiFile(viewProvider: com.intellij.psi.FileViewProvider) :
    com.intellij.psi.impl.source.PsiFileImpl(CATAPILLAR_FILE, CATAPILLAR_ROOT, viewProvider) {
    override fun getFileType(): com.intellij.openapi.fileTypes.FileType = CatapillarFileType.INSTANCE
    override fun accept(visitor: com.intellij.psi.PsiElementVisitor) {
        visitor.visitFile(this)
    }
}

class CatapillarParserDefinition : com.intellij.lang.ParserDefinition {
    override fun getWhitespaceTokens(): TokenSet = TokenSet.create(com.intellij.psi.TokenType.WHITE_SPACE)
    override fun getCommentTokens(): TokenSet = TokenSet.create(CatapillarTokenTypes.LINE_COMMENT, CatapillarTokenTypes.BLOCK_COMMENT)
    override fun getStringLiteralElements(): TokenSet = TokenSet.EMPTY
    override fun getFileNodeType() = CATAPILLAR_FILE
    override fun createFile(viewProvider: com.intellij.psi.FileViewProvider) =
        CatapillarPsiFile(viewProvider)
    override fun createElement(node: ASTNode): PsiElement = when (node.elementType) {
        CATAPILLAR_ROOT -> CatapillarRootElement(node)
        else -> LeafPsiElement(node.elementType, node.text)
    }
    override fun createParser(project: com.intellij.openapi.project.Project): PsiParser = CatapillarParser()
    override fun createLexer(project: com.intellij.openapi.project.Project) = CatapillarLexer()
    override fun spaceExistenceTypeBetweenTokens(left: ASTNode, right: ASTNode) =
        com.intellij.lang.ParserDefinition.SpaceRequirements.MAY
}

class CatapillarParser : PsiParser {
    override fun parse(root: IElementType, builder: PsiBuilder): ASTNode {
        val marker = builder.mark()
        while (!builder.eof()) builder.advanceLexer()
        marker.done(CATAPILLAR_ROOT)
        return builder.treeBuilt
    }
}
