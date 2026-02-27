package lang.catapillar

import com.intellij.ide.structureView.StructureViewModel
import com.intellij.ide.structureView.StructureViewModelBase
import com.intellij.ide.structureView.StructureViewTreeElement
import com.intellij.ide.util.treeView.smartTree.SortableTreeElement
import com.intellij.ide.util.treeView.smartTree.TreeElement
import com.intellij.openapi.editor.Editor
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.psi.PsiFile

data class CatapillarSymbol(
    val name: String,
    val kind: String,
    val line: Int,
    val lineText: String
)

class CatapillarStructureViewModel(psiFile: PsiFile, editor: Editor?) :
    StructureViewModelBase(psiFile, editor, CatapillarStructureViewElement(psiFile, null)),
    StructureViewModel.ElementInfoProvider {
    override fun isAlwaysLeaf(element: StructureViewTreeElement): Boolean = element is CatapillarStructureViewElement && element.symbol != null
    override fun isAlwaysShowsPlus(element: StructureViewTreeElement): Boolean = false
}

class CatapillarStructureViewElement(private val file: PsiFile, val symbol: CatapillarSymbol?) :
    StructureViewTreeElement, SortableTreeElement, com.intellij.pom.Navigatable {
    override fun getValue(): Any = file
    override fun getAlphaSortKey(): String = symbol?.name ?: ""
    override fun getPresentation() = object : com.intellij.navigation.ItemPresentation {
        override fun getPresentableText(): String = symbol?.let { "${it.name} (${it.kind})" } ?: "Catapillar"
        override fun getLocationString(): String? = symbol?.let { "line ${it.line}" }
        override fun getIcon(unused: Boolean) = null
    }
    override fun getChildren(): Array<TreeElement> =
        if (symbol == null) parseSymbols(file).map { CatapillarStructureViewElement(file, it) as TreeElement }.toTypedArray()
        else emptyArray()
    override fun canNavigate() = symbol != null
    override fun canNavigateToSource() = symbol != null
    override fun navigate(requestFocus: Boolean) {
        if (symbol == null) return
        val vf = file.virtualFile ?: return
        val doc = com.intellij.psi.PsiDocumentManager.getInstance(file.project).getDocument(file) ?: return
        val line = (symbol.line - 1).coerceIn(0, doc.lineCount - 1)
        val offset = doc.getLineStartOffset(line)
        OpenFileDescriptor(file.project, vf, offset).navigate(requestFocus)
    }
}

private fun parseSymbols(psiFile: PsiFile): List<CatapillarSymbol> {
    val text = psiFile.text
    val symbols = mutableListOf<CatapillarSymbol>()
    val defRegex = Regex("^(?:\\s*(?:[~><!?])\\s*)?(?:定|def)\\s+([\\w\\u4e00-\\u9fff]+)", RegexOption.MULTILINE)
    text.lines().forEachIndexed { index, line ->
        defRegex.find(line)?.let { m ->
            symbols.add(CatapillarSymbol(m.groupValues[1], "function", index + 1, line.trim()))
        }
        val setRegex = Regex("^(?:\\s*(?:[~><!?])\\s*)?(?:置|set)\\s+([\\w\\u4e00-\\u9fff]+)", RegexOption.MULTILINE)
        setRegex.find(line)?.let { m ->
            val name = m.groupValues[1]
            if (symbols.none { it.kind == "variable" && it.name == name }) {
                symbols.add(CatapillarSymbol(name, "variable", index + 1, line.trim()))
            }
        }
    }
    return symbols
}
