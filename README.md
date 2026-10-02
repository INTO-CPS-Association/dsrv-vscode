# DSRV Language Support for VS Code

Language support for the DSRV runtime-verification language: syntax highlighting, completion, inline diagnostics, and commands for running a model with the [RoboSAPIENS Trustworthiness Checker](https://github.com/INTO-CPS-Association/robosapiens-trustworthiness-checker).

## Features

* **Syntax highlighting** for `.dsrv` files.
* **Completion** for DSRV keywords and built-in functions.
* **Diagnostics** - syntax and type errors reported as you edit, from the DSRV language server.
* **Run commands** - execute the current model with the trustworthiness checker without leaving the editor.

## Requirements

Syntax highlighting works on its own. The other features need two executables:

| Binary | Provides |
|---|---|
| `dsrv-lsp` ([dsrv-lsp](https://github.com/INTO-CPS-Association/dsrv-lsp)) | Completion and diagnostics |
| `trustworthiness_checker` ([repository](https://github.com/INTO-CPS-Association/robosapiens-trustworthiness-checker)) | Running a model |

## Documentation

**[Editor support](https://into-cps-association.github.io/robosapiens-trustworthiness-checker/features/editor-support.html)** in the Trustworthiness Checker documentation covers installation, how to obtain and configure the two binaries, the available run commands, and troubleshooting.

## Building from source

```sh
npm install
npm run build
```

Then open the folder in VS Code and press <kbd>F5</kbd> to launch the extension in a second window with the extension loaded.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development environment, prerequisites, testing, and troubleshooting.

## License

Licensed under GPL-3.0. See [LICENSE](LICENSE)

---

Originally developed as part of a Bachelor's thesis at Aarhus University.
