import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const DEFAULT_BINARY_PATH = "./target/release/trustworthiness_checker";

export type DsrvSemantics = "untimed" | "typed-untimed";

export function getBinaryPath(): string {
  const configuredPath = vscode.workspace
    .getConfiguration("DSRV")
    .get<string>("binaryPath")
    ?.trim();
  const binaryPath = configuredPath || DEFAULT_BINARY_PATH;
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (
    workspaceRoot &&
    !path.isAbsolute(binaryPath) &&
    (binaryPath.startsWith("./") ||
      binaryPath.startsWith("../") ||
      binaryPath.includes("/") ||
      binaryPath.includes("\\"))
  ) {
    return path.resolve(workspaceRoot, binaryPath);
  }

  return binaryPath;
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function buildCommand(
  binaryPath: string,
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics,
): string {
  return [
    shellQuote(binaryPath),
    shellQuote(modelFile),
    "--input-file",
    shellQuote(inputFile),
    "--language",
    "dsrv",
    "--semantics",
    semantics,
    "--output-stdout",
  ].join(" ");
}

export function executeCommand(
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics = "untimed",
): void {
  const terminal =
    vscode.window.activeTerminal || vscode.window.createTerminal("DSRV Terminal");
  terminal.show();
  terminal.sendText(buildCommand(getBinaryPath(), modelFile, inputFile, semantics));
}

function currentFilePath(): string | undefined {
  return vscode.window.visibleTextEditors.find(
    (editor) => editor.document.uri.scheme === "file",
  )?.document.uri.fsPath;
}

async function chooseInputFile(): Promise<string | undefined> {
  const inputFile = await vscode.window.showOpenDialog({
    openLabel: "Select Input File",
    canSelectMany: false,
    filters: { "DSRV Input Files": ["input", "json5", "txt"] },
  });
  const selectedInput = inputFile?.[0]?.fsPath;

  if (!selectedInput) {
    return undefined;
  }

  if (!fs.existsSync(selectedInput)) {
    void vscode.window.showErrorMessage(`Input file not found: ${selectedInput}`);
    return undefined;
  }

  return selectedInput;
}

export async function runWithInput(): Promise<void> {
  const modelFile = currentFilePath();
  if (!modelFile) {
    return;
  }

  const inputFile = await chooseInputFile();
  if (inputFile) {
    executeCommand(modelFile, inputFile);
  }
}

export function runSimpleCommand(): void {
  const modelFile = currentFilePath();
  if (!modelFile) {
    return;
  }

  const inputFile = modelFile.replace(/\.[^/.]+$/, "") + ".input";
  if (!fs.existsSync(inputFile)) {
    void vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
    return;
  }

  executeCommand(modelFile, inputFile);
}

export function runWithTypes(): void {
  const modelFile = currentFilePath();
  if (!modelFile) {
    return;
  }

  const inputFile = modelFile.replace(/\.[^/.]+$/, "") + ".input";
  if (!fs.existsSync(inputFile)) {
    void vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
    return;
  }

  executeCommand(modelFile, inputFile, "typed-untimed");
}

export async function runWithInputAndTypes(): Promise<void> {
  const modelFile = currentFilePath();
  if (!modelFile) {
    return;
  }

  const inputFile = await chooseInputFile();
  if (inputFile) {
    executeCommand(modelFile, inputFile, "typed-untimed");
  }
}
