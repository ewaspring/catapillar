package lang.catapillar.run

import com.intellij.openapi.fileChooser.FileChooserDescriptorFactory
import com.intellij.openapi.options.SettingsEditor
import com.intellij.openapi.ui.TextFieldWithBrowseButton
import com.intellij.ui.components.JBCheckBox
import com.intellij.util.ui.JBUI
import java.awt.GridBagConstraints
import java.awt.GridBagLayout
import java.awt.Insets
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel

class CatapillarRunConfigurationEditor(private val project: com.intellij.openapi.project.Project) :
    SettingsEditor<CatapillarRunConfiguration>() {
    private val scriptPath = TextFieldWithBrowseButton().apply {
        addBrowseFolderListener("Select .cat file", null, project, FileChooserDescriptorFactory.createSingleFileDescriptor("cat"))
    }
    private val pythonPath = javax.swing.JTextField("python", 20)
    private val catapillarRoot = javax.swing.JTextField("", 30)
    private val modeCombo = javax.swing.JComboBox(arrayOf("auto", "python", "flow"))
    private val transpileOnly = JBCheckBox("Transpile to Python only (no run)", false)

    override fun resetEditorFrom(s: CatapillarRunConfiguration) {
        scriptPath.text = s.scriptPath
        pythonPath.text = s.pythonPath
        catapillarRoot.text = s.catapillarRoot
        modeCombo.selectedItem = s.mode
        transpileOnly.isSelected = s.transpileOnly
    }

    override fun applyEditorTo(s: CatapillarRunConfiguration) {
        s.scriptPath = scriptPath.text.trim()
        s.pythonPath = pythonPath.text.trim()
        s.catapillarRoot = catapillarRoot.text.trim()
        s.mode = modeCombo.selectedItem as? String ?: "auto"
        s.transpileOnly = transpileOnly.isSelected
    }

    override fun createEditor(): JComponent {
        val p = JPanel(GridBagLayout())
        p.border = JBUI.Borders.empty(10)
        val c = GridBagConstraints().apply { insets = Insets(2, 2, 2, 2); fill = GridBagConstraints.HORIZONTAL }
        var row = 0
        c.gridx = 0; c.gridy = row; c.weightx = 0.0; p.add(JLabel("Script path (.cat file):"), c)
        c.gridx = 1; c.weightx = 1.0; p.add(scriptPath, c)
        row++
        c.gridx = 0; c.gridy = row; c.weightx = 0.0; p.add(JLabel("Python interpreter:"), c)
        c.gridx = 1; c.weightx = 0.0; p.add(pythonPath, c)
        row++
        c.gridx = 0; c.gridy = row; c.weightx = 0.0; p.add(JLabel("Catapillar root (optional):"), c)
        c.gridx = 1; c.weightx = 1.0; p.add(catapillarRoot, c)
        row++
        c.gridx = 0; c.gridy = row; c.weightx = 0.0; p.add(JLabel("Mode:"), c)
        c.gridx = 1; c.weightx = 0.0; p.add(modeCombo, c)
        row++
        c.gridx = 0; c.gridy = row; c.gridwidth = 2; p.add(transpileOnly, c)
        return p
    }
}
