# Catapillar in PyCharm / IntelliJ IDEA

You can use Catapillar (`.cat` files) in two ways:

## 1. Catapillar plugin (recommended)

Install the **Catapillar** plugin from the `plugin/` directory of this repo. It provides:

- Syntax highlighting, completion, hover, structure view, formatting
- Run configuration and context menu: **Run Catapillar File**, **Transpile to Python**

See [plugin/README.md](../plugin/README.md) for build and install steps.

## 2. Run configurations only (no plugin)

If you only need to run or transpile `.cat` files:

1. Open this repo in PyCharm or IntelliJ IDEA.
2. Configure a **Python** run configuration:
   - **Script path**: `extension/catapillar-runtime/tools/catapillar.py`
   - **Parameters**: `$FilePath$ --exec --mode=auto` (to run) or `$FilePath$ --mode=python` (to transpile)
   - **Working directory**: project root
3. Or use the pre-defined run configs in **.idea/runConfigurations/**:
   - **Catapillar Run** — runs the current `.cat` file
   - **Catapillar Transpile** — transpiles to Python

Same CLI and runtime as the [VS Code extension](../extension/README.md).
