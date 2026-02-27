package lang.catapillar.run

import com.intellij.execution.ExecutionException
import com.intellij.execution.configurations.CommandLineState
import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.KillableProcessHandler
import com.intellij.execution.process.ProcessHandler
import com.intellij.execution.runners.ExecutionEnvironment
import com.intellij.openapi.actionSystem.CommonDataKeys
import java.io.File

class CatapillarRunProfileState(environment: ExecutionEnvironment, private val config: CatapillarRunConfiguration) :
    CommandLineState(environment) {

    private val executionEnvironment = environment

    override fun startProcess(): ProcessHandler {
        val script = config.getCatapillarScript()
            ?: throw ExecutionException("Catapillar runtime not found. Set Catapillar root to a folder containing tools/catapillar.py, plugin/runtime, or extension/catapillar-runtime.")
        val catFile = config.scriptPath.takeIf { it.isNotBlank() }
            ?: executionEnvironment.dataContext?.getData(CommonDataKeys.VIRTUAL_FILE)?.takeIf { it.extension == "cat" }?.path
            ?: throw ExecutionException("Select a .cat file in the editor or set Script path in the run configuration.")
        if (!File(catFile).exists()) throw ExecutionException("File not found: $catFile")
        val root = config.getEffectiveRoot()
        val cmd = GeneralCommandLine(config.pythonPath, script, catFile)
            .withWorkDirectory(File(root))
        if (config.transpileOnly) {
            cmd.addParameter("--mode=python")
        } else {
            cmd.addParameter("--mode=${config.mode}")
            cmd.addParameter("--exec")
        }
        return KillableProcessHandler(cmd)
    }
}
