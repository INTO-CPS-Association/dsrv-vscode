# DSRV VS Code Language Extension

This is a VS Code extension that provides language support for the "DSRV" language. The project was developed as part of my Bachlor's thesis as Aarhus University.

## Features
The extension provides the following features:
* **Syntax Highlighting**: The extension provides syntax highlighting for the "DSRV" language, making it easier to read and write code in this language.
* **Code Completion**: The extension provides code completion suggestions for the "DSRV" language, while not context aware yet, it can still provide suggestions for keywords and functions in the language.
* **Code Running**: The extension include two ways to run code in the "DSRV" language.
* **Error Checking**: The extension provides error checking for the "DSRV" language, highlighting syntax errors and providing feedback to the user.

## Requirements
While the language server is fully functional without any additional dependencies, code running requires a compiled [Trustworthiness Checker](https://github.com/INTO-CPS-Association/robosapiens-trustworthiness-checker) executable. Set `DSRV.binaryPath` to an absolute or workspace-relative path, or to a command name available on `PATH`. The language server is resolved from `DSRV.lspPath` when set, otherwise the `dsrv-lsp` command is resolved from `PATH`.


## Extension Settings
This extension contributes the following settings:
* `DSRV.binaryPath`: Path to `trustworthiness_checker`; defaults to `./target/release/trustworthiness_checker` in the workspace.
* `DSRV.lspPath`: Optional path to `dsrv-lsp`; when empty, `dsrv-lsp` is resolved from `PATH`.

<!-- ## Release Notes -->
<!-- For detailed release notes, please see the [CHANGELOG.md](CHANGELOG.md) file in the project repository. -->

---


## License
The project is licensed under GPL-3.0. For more details, please see the [LICENSE](LICENSE) file in the project repository.
