# Catapillar 🐛

Catapillar is a lightweight experimental language / DSL project.

It is designed as a **foundational layer** that can be embedded into other systems,
languages, or tools, rather than a standalone end-user application.

The focus of Catapillar is on:
- simple syntax
- flexible structure
- extensibility
- serving as a building block for higher-level systems

This project is still evolving, and the design may change as experiments continue.

## Status

🚧 Early stage / experimental  
APIs, syntax, and internal structure are not yet stable.

## Running Catapillar

- **VS Code / Cursor**: Install the extension from `extension/` (see [extension/README.md](extension/README.md)). Run and debug `.cat` files with the same CLI behavior (optional AST dump via `catapillar.debug.printAst`).
- **IntelliJ IDEA / PyCharm**: Install the Catapillar plugin from `plugin/` for full language support (syntax, completion, run/debug), or use the run configurations in `.idea/runConfigurations/` (Catapillar Run, Catapillar Transpile). See [pycharm/README.md](pycharm/README.md) and [plugin/README.md](plugin/README.md). Same CLI and runtime as the extension.
- **CLI**: `python tools/catapillar.py <file.cat> [--mode=auto|flow|python] [--exec] [--print-ast=off|summary|full]`.

## License

MIT License.

## About the Author

This project was initiated by **Yexian** and **Chinatsu**.

It is developed and expanded within the **Kirakira Planet** ecosystem,  
where different languages, systems, and tools evolve as part of a shared creative and technical framework.

Kirakira Planet is not tied to a single language or implementation.  
It serves as a conceptual and developmental space for long-term exploration across software, language design, and human–machine interaction.

Individual projects may vary in form, purpose, and maturity,  
but they all originate from the same core intent:  
to build systems that are expressive, extensible, and deeply usable.

