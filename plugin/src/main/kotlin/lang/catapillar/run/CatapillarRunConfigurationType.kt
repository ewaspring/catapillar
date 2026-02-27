package lang.catapillar.run

import com.intellij.execution.configurations.ConfigurationFactory
import com.intellij.execution.configurations.ConfigurationType
import com.intellij.execution.configurations.RunConfiguration
import com.intellij.openapi.project.Project
import javax.swing.Icon

class CatapillarRunConfigurationType : ConfigurationType {
    override fun getDisplayName(): String = "Catapillar"
    override fun getConfigurationTypeDescription(): String = "Run or transpile a Catapillar (.cat) file"
    override fun getId(): String = "CatapillarRunConfigurationType"
    override fun getIcon(): Icon? = null
    override fun getConfigurationFactories(): Array<ConfigurationFactory> = arrayOf(CatapillarRunConfigurationFactory(this))
}

class CatapillarRunConfigurationFactory(type: ConfigurationType) : ConfigurationFactory(type) {
    override fun createTemplateConfiguration(project: Project): RunConfiguration =
        CatapillarRunConfiguration(project, this, "Catapillar")
    override fun getName(): String = "Catapillar"
}
