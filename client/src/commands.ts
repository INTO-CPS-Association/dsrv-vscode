import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { resolveBinary, settingId, updateSetting } from "./binaries";

export type DsrvSemantics = "untimed" | "typed-untimed";

/** Identifies the tasks this extension creates. */
const TASK_TYPE = "dsrv";

export function getBinaryPath(): string {
  return resolveBinary("trustworthiness_checker").command;
}

/**
 * The checker's arguments, unquoted.
 * The arguments are handed to VS Code as a list, and VS Code quotes
 * them for whichever shell the user has configured.
 */
export function buildArgs(
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics,
): (string | vscode.ShellQuotedString)[] {
  return [
    strongly(modelFile),
    "--input-file",
    strongly(inputFile),
    "--language",
    "dsrv",
    "--semantics",
    semantics,
    "--output-stdout",
  ];
}

export function createRunTask(
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics,
  checkerCommand: string,
): vscode.Task {
  const execution = new vscode.ShellExecution(
    strongly(checkerCommand),
    buildArgs(modelFile, inputFile, semantics),
    { cwd: path.dirname(modelFile) },
  );

  const task = new vscode.Task(
    { type: TASK_TYPE, semantics },
    vscode.workspace.getWorkspaceFolder(vscode.Uri.file(modelFile)) ?? vscode.TaskScope.Workspace,
    `Run ${path.basename(modelFile)}`,
    "DSRV",
    execution,
    [], // No problem matcher yet
  );

  task.presentationOptions = {
    reveal: vscode.TaskRevealKind.Always,
    panel: vscode.TaskPanelKind.Dedicated,
    echo: true,
    clear: false,
    focus: false,
  };

  return task;
}

export async function executeCommand(
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics = "untimed",
): Promise<void> {
  const checker = resolveBinary("trustworthiness_checker");

  if (checker.exists === false) {
    await reportMissingChecker(checker.command);
    return;
  }

  const task = createRunTask(modelFile, inputFile, semantics, checker.command);
  await vscode.tasks.executeTask(task);
}

/** Marks a value for the shell's literal quoting, whatever the shell is. */
function strongly(value: string): vscode.ShellQuotedString {
  return { value, quoting: vscode.ShellQuoting.Strong };
}

function currentFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.scheme !== "file") {
    return undefined;
  }
  return editor.document.uri.fsPath;
}

function siblingInputFile(modelFile: string): string {
  return modelFile.replace(/\.[^/.]+$/, "") + ".input";
}

async function chooseInputFile(): Promise<string | undefined> {
  const picked = await vscode.window.showOpenDialog({
    openLabel: "Select Input File",
    canSelectMany: false,
    filters: { "DSRV Input Files": ["input", "json5", "txt"] },
  });
  return picked?.[0]?.fsPath;
}

async function runWithSiblingInput(semantics: DsrvSemantics): Promise<void> {
  const modelFile = currentFilePath();
  if (!modelFile) {
    void vscode.window.showErrorMessage("Open a .dsrv file to run it.");
    return;
  }

  const inputFile = siblingInputFile(modelFile);
  if (!fs.existsSync(inputFile)) {
    void vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
    return;
  }

  await executeCommand(modelFile, inputFile, semantics);
}

async function runWithChosenInput(semantics: DsrvSemantics): Promise<void> {
  const modelFile = currentFilePath();
  if (!modelFile) {
    void vscode.window.showErrorMessage("Open a .dsrv file to run it.");
    return;
  }

  const inputFile = await chooseInputFile();
  if(inputFile) {
    await executeCommand(modelFile, inputFile, semantics);
  }
}

export function runSimpleCommand(): void {
  void runWithSiblingInput("untimed");
}

export function runWithTypes(): void {
  void runWithSiblingInput("typed-untimed");
}

export async function runWithInput(): Promise<void> {
  await runWithChosenInput("untimed");
}

export async function runWithInputAndTypes(): Promise<void> {
  await runWithChosenInput("typed-untimed");
}

async function reportMissingChecker(attempted: string): Promise<void> {
  const LOCATE = "Locate binary...";
  const OPEN_SETTINGS = "Open settings";

  const choice = await vscode.window.showErrorMessage(
    `Could not find the trustworthiness checker at ${attempted}.`,
    LOCATE,
    OPEN_SETTINGS,
  );

  if (choice === LOCATE) {
    const picked = await vscode.window.showOpenDialog({
      openLabel: "Select the trustworthiness_checker executable",
      canSelectFiles: true,
      canSelectFolders: true,
      canSelectMany: false,
    });
    if (picked?.[0]) {
      await updateSetting("trustworthiness_checker", picked[0].fsPath);
    }
  } else if (choice === OPEN_SETTINGS) {
    void vscode.commands.executeCommand(
      "workbench.action.openSettings",
      settingId("trustworthiness_checker"),
    );
  }
}
