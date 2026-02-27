package lang.catapillar

import com.intellij.lang.annotation.AnnotationHolder
import com.intellij.lang.annotation.ExternalAnnotator
import com.intellij.openapi.editor.Editor
import com.intellij.psi.PsiFile

/**
 * Optional: run Python/Node to get parse diagnostics and show as annotations.
 * Currently a no-op; can be extended to call extension/catapillar-runtime/tools/ide_parse.py
 * or the extension's parser and display errors/warnings.
 */
class CatapillarExternalAnnotator : ExternalAnnotator<PsiFile?, Void?>() {
    override fun collectInformation(file: PsiFile, editor: Editor, hasErrors: Boolean): PsiFile? =
        if (file.language == CatapillarLanguage) file else null
    override fun doAnnotate(collected: PsiFile?): Void? = null
    override fun apply(file: PsiFile, annotationResult: Void?, holder: AnnotationHolder) {}
}
