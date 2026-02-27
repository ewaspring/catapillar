package lang.catapillar

import com.intellij.codeInsight.completion.*
import com.intellij.codeInsight.lookup.LookupElementBuilder
import com.intellij.patterns.PlatformPatterns
import com.intellij.psi.PsiElement
import com.intellij.util.ProcessingContext

class CatapillarCompletionContributor : CompletionContributor() {
    init {
        extend(CompletionType.BASIC, PlatformPatterns.psiElement().withLanguage(CatapillarLanguage),
            object : CompletionProvider<CompletionParameters>() {
                override fun addCompletions(
                    parameters: CompletionParameters,
                    context: ProcessingContext,
                    result: CompletionResultSet
                ) {
                    val file = parameters.originalFile
                    val document = file.viewProvider.document ?: return
                    val offset = parameters.offset
                    val text = document.text
                    val lineStart = text.lastIndexOf('\n', offset - 1) + 1
                    val lineText = text.substring(lineStart, offset)
                    val trimmed = lineText.trimStart()
                    val prefix = trimmed.takeLastWhile { it.isLetterOrDigit() || it in "\u4e00-\u9fff" }.toString()
                        .replace(Regex("[^\\w\\u4e00-\\u9fff]"), "").takeLast(20)

                    // Line states
                    if (trimmed.isEmpty() || Regex("^[~><!?]\\s*$").matches(trimmed)) {
                        for (ls in CatapillarKeywords.LINE_STATES) {
                            result.addElement(LookupElementBuilder.create(ls).withTypeText("Line state"))
                        }
                    }
                    // Keywords
                    for (kw in CatapillarKeywords.KEYWORDS) {
                        for (form in kw.forms) {
                            if (prefix.isEmpty() || form.startsWith(prefix) || form.contains(prefix)) {
                                val item = LookupElementBuilder.create(form)
                                    .withTypeText(kw.descriptionEn)
                                    .withTailText(" [${kw.actionId}]")
                                result.addElement(item)
                            }
                        }
                    }
                    // Block end
                    for (form in CatapillarKeywords.STRUCT_END) {
                        if (prefix.isEmpty() || form.startsWith(prefix)) {
                            result.addElement(LookupElementBuilder.create(form).withTypeText("End block"))
                        }
                    }
                    // In keywords
                    for (form in CatapillarKeywords.IN_KEYWORDS) {
                        if (prefix.isEmpty() || form.startsWith(prefix)) {
                            result.addElement(LookupElementBuilder.create(form).withTypeText("In (for loop)"))
                        }
                    }
                    // Symbols from document: 定 name / 置 name
                    val defRegex = Regex("(?:^|\\s)(?:定|def)\\s+([\\w\\u4e00-\\u9fff]+)", RegexOption.MULTILINE)
                    defRegex.findAll(text).forEach { m ->
                        val name = m.groupValues[1]
                        if (name.isNotBlank() && (prefix.isEmpty() || name.startsWith(prefix))) {
                            result.addElement(LookupElementBuilder.create(name).withTypeText("Function"))
                        }
                    }
                    val setRegex = Regex("(?:^|\\s)(?:置|set)\\s+([\\w\\u4e00-\\u9fff]+)", RegexOption.MULTILINE)
                    val seenVars = mutableSetOf<String>()
                    setRegex.findAll(text).forEach { m ->
                        val name = m.groupValues[1]
                        if (name.isNotBlank() && seenVars.add(name) && (prefix.isEmpty() || name.startsWith(prefix))) {
                            result.addElement(LookupElementBuilder.create(name).withTypeText("Variable"))
                        }
                    }
                }
            })
    }
}
