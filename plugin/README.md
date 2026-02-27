# Catapillar IntelliJ / PyCharm Plugin

Language support for **Catapillar** (`.cat` files) in IntelliJ IDEA and PyCharm: syntax highlighting, code completion, hover documentation, structure view, formatting, and run/debug.

## Features

- **Syntax highlighting** — keywords (定/def, 若/if, 置/set, 印/print, etc.), line states (~, >, <, !, ?), comments, numbers, identifiers
- **Completion** — keywords, line states, block end (终), and symbols (functions/variables from the file)
- **Hover** — documentation for keywords and symbols
- **Structure view** — outline of functions and variables (定/def, 置/set)
- **Formatting** — format document (indent by block structure)
- **Run / Transpile** — run configuration and context menu: Run Catapillar File, Transpile to Python

## Requirements

- **IntelliJ IDEA** or **PyCharm** 2023.3 or newer
- **Python** on PATH (for run/transpile)
- **Runtime**: The plugin **bundles** the Catapillar runtime (like the VS Code extension’s `extension/catapillar-runtime/`). You can run `.cat` files with **no repo or project root** — just install the plugin and have Python available. To use a different runtime (e.g. your clone), set **Catapillar root** in the run configuration to a folder that contains `tools/catapillar.py` or `extension/catapillar-runtime/tools/catapillar.py`.

## Build and install

1. Open the `plugin/` folder in IntelliJ IDEA (or the whole repo with `plugin` as a module).
2. Build: **Build → Build Project**, or from terminal (with [Gradle](https://gradle.org/install/) installed):
   ```bash
   cd plugin
   gradle wrapper   # first time only
   ./gradlew buildPlugin
   ```
3. Install from disk: **Settings → Plugins → ⚙️ → Install Plugin from Disk** → choose `plugin/build/distributions/catapillar-plugin-0.1.0.zip`.

   If **Run → Run 'Run Plugin'** (or `./gradlew runIde`) crashes with exit 134 (SIGABRT) on your system, use the zip to install the plugin in your existing IntelliJ or PyCharm instead.

## Run configuration

- **Script path**: the `.cat` file to run or transpile.
- **Python interpreter**: `python` by default.
- **Catapillar root** (optional): folder containing `tools/catapillar.py` or `extension/catapillar-runtime/`. If empty, the project base path is used.
- **Mode**: `auto`, `python`, or `flow`.
- **Transpile to Python only**: if checked, only transpiles (no execution).

Right‑click a `.cat` file → **Run Catapillar File** or **Transpile to Python** to run with the current file.

## Relation to the VS Code extension

The same CLI and runtime are used: `python tools/catapillar.py <file.cat> [--mode=...] [--exec]`. The plugin reuses the repo’s `extension/catapillar-runtime/` (or a standalone `tools/` when Catapillar root points there).
