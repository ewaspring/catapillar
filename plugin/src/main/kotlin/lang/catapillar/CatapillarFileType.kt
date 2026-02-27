package lang.catapillar

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

class CatapillarFileType private constructor() : LanguageFileType(CatapillarLanguage) {
    override fun getName(): String = "Catapillar"
    override fun getDescription(): String = "Catapillar source file"
    override fun getDefaultExtension(): String = "cat"
    override fun getIcon(): Icon? = null

    companion object {
        @JvmStatic
        val INSTANCE = CatapillarFileType()
    }
}
