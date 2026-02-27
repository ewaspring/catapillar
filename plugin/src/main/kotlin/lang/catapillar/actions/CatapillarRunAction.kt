package lang.catapillar.actions

import com.intellij.execution.Executor
import com.intellij.execution.RunManager
import com.intellij.execution.executors.DefaultRunExecutor
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import lang.catapillar.CatapillarFileType
import lang.catapillar.run.CatapillarRunConfiguration
import lang.catapillar.run.CatapillarRunConfigurationFactory
import lang.catapillar.run.CatapillarRunConfigurationType

class CatapillarRunAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE) ?: return
        if (file.extension != "cat") return
        val path = file.path
        val runManager = RunManager.getInstance(project)
        val type = CatapillarRunConfigurationType()
        val factory = CatapillarRunConfigurationFactory(type)
        val runnerAndConfig = runManager.createConfiguration("Catapillar", factory)
        val config = runnerAndConfig.configuration as? CatapillarRunConfiguration ?: return
        config.scriptPath = path
        config.transpileOnly = false
        runManager.addConfiguration(runnerAndConfig)
        runManager.selectedConfiguration = runnerAndConfig
        com.intellij.execution.ProgramRunnerUtil.executeConfiguration(project, runnerAndConfig, DefaultRunExecutor.getRunExecutorInstance())
    }

    override fun update(e: AnActionEvent) {
        val file = e.getData(CommonDataKeys.VIRTUAL_FILE)
        e.presentation.isEnabledAndVisible = file?.extension == "cat"
    }

    override fun getActionUpdateThread(): ActionUpdateThread = ActionUpdateThread.BGT
}
