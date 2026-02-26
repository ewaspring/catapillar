# Catapillar VS Code Extension

Language support for **Catapillar** (`.cat` files) — syntax highlighting, IntelliSense, formatting, refactoring, and debugging.

---

## Run and Debug: requirements

- **Python** on PATH (required).
- The extension **embeds** a full Catapillar runtime (`catapillar-runtime/`). You can install the extension from anywhere and create/run `.cat` files with **no repo or project root** — just install the VSIX and have Python available.
- Optional: `pip install pyyaml` to use `.yaml` lexicons; the extension ships `.json` fallbacks so **no pip install is required**.
- To use an **external** repo instead of the bundled runtime, set **Catapillar: Project Root** (`catapillar.projectRoot`) to the folder that contains `tools/catapillar.py`.

---

## Install & Run

### 1. Build the extension

```bash
cd extension
npm install
npm run compile
```

### 2. Install in VS Code

**Option A — Run from source (development)**

1. Open the **Catapillar** project folder in VS Code (the repo root, not just `extension/`).
2. Press **F5** or use **Run > Start Debugging**.
3. A new VS Code window opens with the extension loaded. Open any `.cat` file there.

**Option B — Install the VSIX (packaged)**

```bash
cd extension
npm run package
```

Then in VS Code: **Extensions** view → **...** → **Install from VSIX** → choose `catapillar-0.1.0.vsix`.

### 3. Install on other computers

1. **On this machine** — build the installable package once:
   ```bash
   cd extension
   npm install
   npm run package
   ```
   This creates **`catapillar-0.1.0.vsix`** in the `extension/` folder.

2. **Copy the VSIX** to the other computer (USB, network, cloud, etc.):
   - File: `extension/catapillar-0.1.0.vsix`

3. **On the other computer** — install in VS Code or Cursor:
   - Open VS Code/Cursor → **Extensions** (Ctrl+Shift+X) → **...** (top right) → **Install from VSIX...** → select `catapillar-0.1.0.vsix`.
   - Or from terminal: `code --install-extension /path/to/catapillar-0.1.0.vsix` (use `cursor` instead of `code` for Cursor).

4. Reload the editor if asked. The extension includes a **bundled runtime**, so the other computer only needs **Python on PATH** (and optionally `pip install pyyaml`). No repo or project root is required. To use a different Catapillar repo, set **Catapillar: Project Root** in settings.

---

## How to Use

### Open a Catapillar file

- Open any file with extension `.cat`, or
- Create a new file and save it as `something.cat`.

The editor will use Catapillar language mode (syntax highlighting, IntelliSense, etc.).

### IntelliSense

- **Auto-completion**: Type at the start of a line or after a space; you get suggestions for keywords (定/def, 若/if, 置/set, 印/print, etc.), line states (`~`, `>`, `<`, `!`, `?`), and symbols (functions, variables) from the file.
- **Hover**: Hover over a keyword or symbol to see documentation (EN / 中文 / 日本語).
- **Outline**: Use the **Outline** view or **Go to Symbol** (Ctrl+Shift+O) to jump to function and variable definitions.
- **Go to Definition**: Right‑click a name (e.g. after `调 calc`) → **Go to Definition**, or F12.
- **Find References**: Right‑click a name → **Find All References**.

### Syntax checking (diagnostics)

- Errors and warnings (unknown actions, invalid line state, unclosed blocks) appear as squiggles and in the **Problems** panel.
- Toggle in settings: `catapillar.diagnostics.enable`.

### Formatting

- **Format Document**: Right‑click in editor → **Format Document**, or Shift+Alt+F.
- **Format Selection**: Select lines → **Format Selection**.
- Set indentation: `catapillar.formatting.indentSize` (0 = no indent, 2 or 4 for readable blocks).

### Refactoring

- Select an expression on one line → lightbulb → **Extract to variable (置)** to introduce a `置 newVar ...` line.
- Select multiple lines → lightbulb → **Extract to function (定)** to wrap them in `定 newFunc:` … `终` and replace with `调 newFunc`.

### Snippets

- Type a prefix and press Tab: e.g. `定`, `若`, `当`, `试`, `置`, `印`, `调`, or snippet names like `ifelse`, `tryf`, `calc`.

### Run & Debug

**Run (no debugger)**

- Open a `.cat` file.
- **Command Palette** (Ctrl+Shift+P) → **Catapillar: Run Catapillar File**, or
- Right‑click in editor → **Run Catapillar File**, or
- Shortcut: **Ctrl+Shift+R** (Cmd+Shift+R on Mac).

Output appears in the **Catapillar** output channel.

**Debug (Run and Debug)**

1. Ensure the **Catapillar** project root (the repo containing `tools/catapillar.py`) is your workspace folder or set `catapillar.projectRoot` in settings.
2. Open a `.cat` file.
3. **Run and Debug** (Ctrl+Shift+D) → **Run Catapillar File** (or add a launch config; see below).
4. The extension runs `python tools/catapillar.py <file.cat> --mode=auto --exec` and shows stdout/stderr in the Debug Console.

**Launch configuration** (optional) in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "catapillar",
      "request": "launch",
      "name": "Run Catapillar File",
      "program": "${file}",
      "mode": "auto",
      "pythonPath": "python",
      "catapillarRoot": "${workspaceFolder}"
    }
  ]
}
```

- `program`: path to the `.cat` file (usually `${file}`).
- `mode`: `auto` (default), `python` (transpile to Python), or `flow` (runtime engine).
- `catapillarRoot`: folder that contains `tools/catapillar.py`; leave empty to use workspace folder.
- `pythonPath`: Python interpreter (default `python`).

### Other commands

- **Catapillar: Transpile to Python** — runs the file with `--mode=python` and shows generated Python in the output channel.
- **Catapillar: Show AST** — parses the current file and opens the AST as JSON in a new editor.

---

## Settings

| Setting | Default | Description |
|--------|---------|-------------|
| `catapillar.pythonPath` | `python` | Python interpreter for run/debug and transpile |
| `catapillar.projectRoot` | (empty) | Path to Catapillar repo (with `tools/catapillar.py`). Empty = use workspace folder |
| `catapillar.diagnostics.enable` | `true` | Enable syntax diagnostics |
| `catapillar.formatting.indentSize` | `0` | Spaces for formatting (0 = no indent) |
| `catapillar.completion.showChineseKeywords` | `true` | Show Chinese keywords in completion |
| `catapillar.completion.showEnglishKeywords` | `true` | Show English keywords in completion |
| `catapillar.debug.printAst` | `off` | When running: `off` (no AST), `summary` (one-line), `full` (full AST JSON). Same behavior as CLI `--print-ast=` and PyCharm run config. |

---

## Localization

The extension UI (commands, settings, debug labels) is localized for:

- **en** — English  
- **ja** — 日本語  
- **zh-cn** — 简体中文  

VS Code uses the language matching your display language.

---

## Requirements

- **VS Code** 1.85 or newer.
- For **Run** and **Debug**: **Python** on PATH. The extension ships a **bundled runtime**; no repo or project root is required. To use your own Catapillar repo, set `catapillar.projectRoot`.

## Extensibility

- **Bundled runtime**: The extension includes a full Catapillar runtime under `catapillar-runtime/` (tools, parser, mapper, runtime, lexicons). Install the VSIX anywhere and run `.cat` files with no extra setup.
- **Override with your repo**: Set **Catapillar: Project Root** to a folder containing `tools/catapillar.py` to use that runtime instead (e.g. for development or custom lexicons).
- **Lexicons**: Bundled lexicons are provided as both `.yaml` and `.json`; the loader uses JSON when PyYAML is not installed, so no pip install is required.
