# DSRV VS Code Language Extension

This is a VS Code extension that provides language support for the "DSRV" language. The project was developed as part of my Bachelor's thesis at Aarhus University.

## Features

The extension provides the following features:

* **Syntax Highlighting**: The extension provides syntax highlighting for the DSRV language, making it easier to read and write DSRV code.
* **Code Completion**: The extension provides completion suggestions for DSRV keywords and functions. Suggestions are not yet context-aware.
* **Code Running**: The extension provides commands for running DSRV models with the trustworthiness checker.
* **Error Checking**: The extension highlights syntax and type errors and provides feedback through the language server.

## Requirements

The code-running capabilities require the [trustworthiness checker](https://github.com/INTO-CPS-Association/robosapiens-trustworthiness-checker) to be compiled separately. Language features such as completion and error checking additionally require the `dsrv-lsp` binary from the [dsrv-lsp](https://github.com/INTO-CPS-Association/dsrv-lsp) repository.

Set `DSRV.binaryPath` to an absolute or workspace-relative checker path, or to a command name available on `PATH`. The language server is resolved from `DSRV.lspPath` when set; otherwise, `dsrv-lsp` is resolved from `PATH`.

## Development Setup

### 1. Install dependencies and build

Install [Node.js and npm](https://nodejs.org/en/download), then run:

```bash
npm install
npm run build
```

### 2. Add the launch configuration

Create `.vscode/launch.json` in the project root:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/dist/**/*.js"
            ]
        }
    ]
}
```

### 3. Launch the extension

Open the `dsrv-vscode` folder in VS Code, open the Run and Debug panel (`Ctrl+Shift+D`), select **Run Extension**, and press **F5**. A second VS Code window—the Extension Development Host—will open with the extension loaded.

### 4. Configure binary paths

In the Extension Development Host window, go to **File → Preferences → Settings** (`Ctrl+,`) and search for `DSRV`. Configure these paths as needed:

| Setting | Description |
|---|---|
| `DSRV: Lsp Path` | Path to the `dsrv-lsp` binary, or a command available on `PATH` |
| `DSRV: Binary Path` | Path to the `trustworthiness_checker` binary, or a command available on `PATH` |

If `dsrv-lsp` is on your system `PATH`, leave `DSRV: Lsp Path` empty. The trustworthiness checker defaults to `./target/release/trustworthiness_checker` relative to the workspace root if `DSRV: Binary Path` is not set.

## Running DSRV Code

With the extension loaded and `DSRV.binaryPath` configured, open a `.dsrv` file. Four play buttons appear in the editor title bar:

| Button | Input file | Semantics |
|---|---|---|
| **Run DSRV** | `<samename>.input` in the same folder | `untimed` |
| **Choose Input File and Run DSRV** | Selected through a file dialog | `untimed` |
| **Run DSRV with Typed semantics** | `<samename>.input` in the same folder | `typed-untimed` |
| **Choose Input file and run with Typed semantics** | Selected through a file dialog | `typed-untimed` |

The extension opens a terminal and invokes the trustworthiness checker with the current CLI arguments:

```text
<trustworthiness_checker> <model.dsrv> --input-file <input> --language dsrv --semantics untimed --output-stdout
```

For typed variants, `--semantics untimed` is replaced with `--semantics typed-untimed`.

The simplest workflow is to keep an `.input` file next to the `.dsrv` file with the same base name—for example, `model.dsrv` and `model.input`—then click **Run DSRV** without using a file picker.

## Extension Settings

This extension contributes the following settings:

* `DSRV.lspPath`: Optional path to `dsrv-lsp`; when empty, `dsrv-lsp` is resolved from `PATH`.
* `DSRV.binaryPath`: Path to `trustworthiness_checker`; defaults to `./target/release/trustworthiness_checker` in the workspace.

<!-- ## Release Notes -->
<!-- For detailed release notes, please see the [CHANGELOG.md](CHANGELOG.md) file in the project repository. -->

---

## License

The project is licensed under GPL-3.0. For more details, see the [LICENSE](LICENSE) file in the project repository.
