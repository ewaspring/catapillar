package lang.catapillar.run

import com.intellij.execution.Executor
import com.intellij.execution.configurations.RuntimeConfigurationException
import com.intellij.execution.configurations.*
import com.intellij.execution.runners.ExecutionEnvironment
import com.intellij.openapi.options.SettingsEditor
import com.intellij.openapi.project.Project
import lang.catapillar.CatapillarRuntime
import org.jdom.Element
import java.io.File

class CatapillarRunConfiguration(project: Project, factory: ConfigurationFactory, name: String) :
    RunConfigurationBase<RunConfigurationOptions>(project, factory, name) {

    var scriptPath: String = ""
    var mode: String = "auto"
    var pythonPath: String = "python"
    var catapillarRoot: String = ""
    var transpileOnly: Boolean = false

    override fun getConfigurationEditor(): SettingsEditor<out RunConfiguration> = CatapillarRunConfigurationEditor(project)
    override fun getState(executor: Executor, environment: ExecutionEnvironment): RunProfileState =
        CatapillarRunProfileState(environment, this)

    override fun checkConfiguration() {
        super.checkConfiguration()
        if (getCatapillarScript() == null) {
            throw RuntimeConfigurationException(
                "Catapillar runtime not found. Set Catapillar root to a folder containing tools/catapillar.py, plugin/runtime, or extension/catapillar-runtime."
            )
        }
        if (scriptPath.isNotBlank() && !File(scriptPath).exists()) {
            throw RuntimeConfigurationException("File not found: $scriptPath")
        }
    }

    override fun writeExternal(element: Element) {
        super.writeExternal(element)
        element.setAttribute("scriptPath", scriptPath)
        element.setAttribute("mode", mode)
        element.setAttribute("pythonPath", pythonPath)
        element.setAttribute("catapillarRoot", catapillarRoot)
        element.setAttribute("transpileOnly", transpileOnly.toString())
    }

    override fun readExternal(element: Element) {
        super.readExternal(element)
        scriptPath = element.getAttributeValue("scriptPath") ?: ""
        mode = element.getAttributeValue("mode") ?: "auto"
        pythonPath = element.getAttributeValue("pythonPath") ?: "python"
        catapillarRoot = element.getAttributeValue("catapillarRoot") ?: ""
        transpileOnly = element.getAttributeValue("transpileOnly")?.toBoolean() ?: false
    }

    /** Working directory for the run process: the runtime root (parent of tools/), so Python can import parser, runtime, etc. */
    fun getEffectiveRoot(): String {
        val script = getCatapillarScript() ?: return project.basePath ?: ""
        val scriptFile = File(script)
        // tools/catapillar.py -> parent = tools, parentFile.parent = runtime root
        return scriptFile.parentFile?.parentFile?.absolutePath ?: scriptFile.parent ?: project.basePath ?: ""
    }

    fun getCatapillarScript(): String? {
        // 1) Explicit project root / script directory
        val root = catapillarRoot.takeIf { it.isNotBlank() }
            ?: scriptPath.takeIf { it.isNotBlank() }?.let { File(it).parentFile?.absolutePath }
            ?: project.basePath
        if (root != null && root.isNotBlank()) {
            val rootFile = File(root)
            val extTools = File(rootFile, "extension/catapillar-runtime/tools/catapillar.py")
            if (extTools.exists()) return extTools.absolutePath
            val pluginRuntime = File(rootFile, "plugin/runtime/tools/catapillar.py")
            if (pluginRuntime.exists()) return pluginRuntime.absolutePath
            val tools = File(rootFile, "tools/catapillar.py")
            if (tools.exists()) return tools.absolutePath
        }
        // 2) Bundled runtime (plugin/runtime)
        return CatapillarRuntime.getBundledCatapillarScript()?.absolutePath
    }
}
