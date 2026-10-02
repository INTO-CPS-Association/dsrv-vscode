import * as vscode from "vscode";
import * as fs from "fs";
import { resolveBinary, settingId, updateSetting } from "./binaries";

export type DsrvSemantics = "untimed" | "typed-untimed";

export function getBinaryPath(): string {
  return resolveBinary("trustworthiness_checker").command;
}

let dsrvTerminal: vscode.Terminal | undefined;

function getDsrvTerminal(): vscode.Terminal {
  if (!dsrvTerminal || dsrvTerminal.exitStatus !== undefined) {
    dsrvTerminal = vscode.window.createTerminal("DSRV");
  }
  return dsrvTerminal;
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
  const checker = resolveBinary("trustworthiness_checker");

  if (checker.exists === false) {
    void reportMissingChecker(checker.command);
    return;
  }

  const terminal = getDsrvTerminal();
  terminal.show();
  terminal.sendText(buildCommand(checker.command, modelFile, inputFile, semantics));
}

async function reportMissingChecker(attempted: string): Promise<void> {
  const choice = await vscode.window.showErrorMessage(
    `Could not find the trustworthiness checker at ${attempted}.`,
    "Locate binary...",
    "Open settings",
  );

  if (choice === "Locate binary...") {
    const picked = await vscode.window.showOpenDialog({
      openLabel: "Select the trustworthiness_checker executable",
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (picked?.[0]) {
      await updateSetting("trustworthiness_checker", picked[0].fsPath);
    }
  } else if (choice === "Open settings") {
    void vscode.commands.executeCommand(
      "workbench.action.openSettings",
      settingId("trustworthiness_checker"),
    );
  }
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
