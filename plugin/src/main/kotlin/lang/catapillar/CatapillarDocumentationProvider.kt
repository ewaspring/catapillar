package lang.catapillar

import com.intellij.lang.documentation.DocumentationProvider
import com.intellij.psi.PsiElement

class CatapillarDocumentationProvider : DocumentationProvider {
    override fun generateDoc(element: PsiElement?, originalElement: PsiElement?): String? {
        val text = element?.text ?: return null
        val word = text.trim().takeWhile { it.isLetterOrDigit() || it in "~><!?在终\u4e00-\u9fff" }
        if (word.isEmpty()) return null
        // Line state
        if (word in CatapillarKeywords.LINE_STATES) {
            val desc = when (word) {
                "~" -> "Continue — default line state"
                ">" -> "Advance — segment boundary"
                "<" -> "Return / Echo"
                "!" -> "Strong / Commit"
                "?" -> "Tentative / Await"
                else -> ""
            }
            return "<b>Line state '$word'</b><br>$desc"
        }
        // Keyword
        val kw = CatapillarKeywords.findByForm(word)
        if (kw != null) {
            return "<b>${word}</b> [${kw.actionId}]<br>Category: ${kw.category}<br><br>${kw.detailEn}"
        }
        if (word in CatapillarKeywords.STRUCT_END) return "<b>$word</b> — End block"
        if (word in CatapillarKeywords.NULL_LITERALS) return "<b>$word</b> — null / None"
        if (word in CatapillarKeywords.OPERATOR_KEYWORDS) return "<b>$word</b> — comparison/boolean operator"
        // Symbol: function or variable
        val file = element?.containingFile?.text ?: return null
        val defRegex = Regex("(?:定|def)\\s+$word\\s*[:(]", RegexOption.MULTILINE)
        if (defRegex.containsMatchIn(file)) {
            val lineNum = file.lines().indexOfFirst { defRegex.containsMatchIn(it) } + 1
            return "<b>function</b> $word<br>Defined in this file (line $lineNum)"
        }
        val setRegex = Regex("(?:置|set)\\s+$word\\s+", RegexOption.MULTILINE)
        if (setRegex.containsMatchIn(file)) {
            val lineNum = file.lines().indexOfFirst { setRegex.containsMatchIn(it) } + 1
            return "<b>variable</b> $word<br>First assigned at line $lineNum"
        }
        return null
    }
}
