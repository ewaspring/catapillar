package lang.catapillar

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.openapi.extensions.PluginId
import java.io.File

/**
 * Resolves the Catapillar runtime: the bundled plugin runtime (plugin/runtime,
 * like extension/catapillar-runtime in the VS Code extension).
 */
object CatapillarRuntime {
    private const val PLUGIN_ID = "lang.catapillar"
    private const val RUNTIME_SUBDIR = "runtime"
    private const val TOOLS_SCRIPT = "tools/catapillar.py"

    /**
     * Root directory of the bundled runtime (contains tools/, parser/, etc.),
     * or null if the plugin is not installed or the runtime is not bundled.
     */
    @JvmStatic
    fun getBundledRuntimeRoot(): File? {
        val descriptor = PluginManagerCore.getPlugin(PluginId.getId(PLUGIN_ID)) ?: return null
        if (PluginManagerCore.isDisabled(PluginId.getId(PLUGIN_ID))) return null
        val pluginPath = descriptor.pluginPath?.toFile() ?: return null
        val runtimeDir = File(pluginPath, RUNTIME_SUBDIR)
        return if (runtimeDir.isDirectory) runtimeDir else null
    }

    /**
     * Path to tools/catapillar.py in the bundled runtime, or null.
     */
    @JvmStatic
    fun getBundledCatapillarScript(): File? {
        val root = getBundledRuntimeRoot() ?: return null
        val script = File(root, TOOLS_SCRIPT)
        return if (script.isFile) script else null
    }
}
