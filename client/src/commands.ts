import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { resolveBinary, settingId, updateSetting } from "./binaries";

/** Identifies the tasks this extension creates. */
const TASK_TYPE = "dsrv";

/** Every semantics the checker accepts for DSRV */
export const SEMANTICS = [
  "untimed",
  "typed-untimed",
  "causal"
] as const;

export type DsrvSemantics = (typeof SEMANTICS)[number];


/** The runtimes that affect DSRV. */
export const RUNTIMES = ["semi-sync", "dataflow"] as const;

export type DsrvRuntime = (typeof RUNTIMES)[number];

/** 'causal' only works under this runtime. */
const CAUSAL_RUNTIME: DsrvRuntime = "semi-sync";

/**
 * The configured semantics, or undefined to mean "let the checker decide".
 * 
 * An empy setting deliberately passes no `--semantics` at all, so the
 * checker's own default applies.
 */
export function configuredSemantics(): DsrvSemantics | undefined {
  return readEnum("semantics", SEMANTICS);
}

/** The configured runtime, or undefined to mean "let the checker decide" */
export function configuredRuntime(): DsrvRuntime | undefined {
  return readEnum("runtime", RUNTIMES);
}

/** The runtime a run will actually use */
export function effectiveRuntime(
  semantics: DsrvSemantics | undefined,
  configured: DsrvRuntime | undefined,
): DsrvRuntime | undefined {
  return semantics === "causal" ? CAUSAL_RUNTIME : configured;
}

/**
 * The checker's arguments, unquoted.
 * The arguments are handed to VS Code as a list, and VS Code quotes
 * them for whichever shell the user has configured.
 */
export function buildArgs(
  modelFile: string,
  inputFile: string,
  semantics?: DsrvSemantics,
  runtime?: DsrvRuntime,
): (string | vscode.ShellQuotedString)[] {
  const args: (string | vscode.ShellQuotedString)[] = [
    strongly(modelFile),
    "--input-file",
    strongly(inputFile),
    "--language",
    "dsrv",
  ];

  if (semantics) {
    args.push("--semantics", semantics);
  }

  if (runtime) {
    args.push("--runtime", runtime);
  }

  args.push("--output-stdout");
  return args;
}

export function createRunTask(
  modelFile: string,
  inputFile: string,
  semantics: DsrvSemantics | undefined,
  checkerCommand: string,
  runtime?: DsrvRuntime,
): vscode.Task {
  const execution = new vscode.ShellExecution(
    strongly(checkerCommand),
    buildArgs(modelFile, inputFile, semantics, runtime),
    { cwd: path.dirname(modelFile) },
  );

  const task = new vscode.Task(
    { type: TASK_TYPE, semantics: semantics ?? null, runtime: runtime ?? null },
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
  semantics?: DsrvSemantics,
): Promise<void> {
  const checker = resolveBinary("trustworthiness_checker");

  if (checker.exists === false) {
    await reportMissingChecker(checker.command);
    return;
  }

  const runtime = effectiveRuntime(semantics, configuredRuntime());

  const task = createRunTask(modelFile, inputFile, semantics, checker.command, runtime);
  await vscode.tasks.executeTask(task);
}

// ------------------------------------------------
// Commands
// ------------------------------------------------

/** Run the current model with the configured semantics. */
export async function run(): Promise<void> {
  await runModel(configuredSemantics());
}

/** Run the current model with semantics chosen for this run only. */
export async function runWith(): Promise<void> {
  if (!currentFilePath()) {
    void vscode.window.showErrorMessage("Open a .dsrv file to run it.");
    return;
  }
  
  const picked = await pickSemantics("Run with");
  if (!picked) {
    return;
  }
  await runModel(picked.value);
}

/** Change the configured semantics. */
export async function selectSemantics(): Promise<void> {
  const picked = await pickSemantics("DSRV semantics");
  if (!picked) {
    return;
  }
  await vscode.workspace
    .getConfiguration("DSRV")
    .update(
      "semantics",
      picked.value ?? "",
      vscode.ConfigurationTarget.Workspace,
    );
}

async function runModel(semantics: DsrvSemantics | undefined): Promise<void> {
  const modelFile = currentFilePath();
  if (!modelFile) {
    void vscode.window.showErrorMessage("Open a .dsrv file to run it.");
    return;
  }

  const inputFile = await resolveInputFile(modelFile);
  if (!inputFile) {
    return;
  }

  await executeCommand(modelFile, inputFile, semantics);
}

// ------------------------------------------------
// Status bar
// ------------------------------------------------

/** What the status bar shows for the current configuration. */
export function statusText(
  semantics: DsrvSemantics | undefined,
  runtime: DsrvRuntime | undefined,
): string {
  const parts = [semantics ?? "checker default"];
  if (runtime) {
    parts.push(runtime);
  }
  return `DSRV: ${parts.join(" · ")}`;
}

/** Shows which semantics a run will use */
export function registerStatusBar(context: vscode.ExtensionContext): void {
  const item = vscode.window.createStatusBarItem(
    "dsrv.semantics",
    vscode.StatusBarAlignment.Right,
    100,
  );
  item.name = "DSRV semantics";
  item.command = "DSRV.selectSemantics";
  item.tooltip = "Semantics used when running a DSRV model";

  const update = (): void => {
    const editor = vscode.window.activeTextEditor;
    if (editor?.document.languageId === "dsrv") {
      const semantics = configuredSemantics();
      item.text = statusText(
        semantics,
        effectiveRuntime(semantics, configuredRuntime()),
      );
      item.show();
    } else {
      item.hide();
    }
  };

  context.subscriptions.push(
    item,
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("DSRV.semantics") ||
        event.affectsConfiguration("DSRV.runtime")
      ) {
        update();
      }
    }),
  );

  update();
}

// ------------------------------------------------

interface SemanticsItem extends vscode.QuickPickItem {
  /** undefined means "let the checker decide" */
  value?: DsrvSemantics;
}

async function pickSemantics(title: string): Promise<SemanticsItem | undefined> {
  const items: SemanticsItem[] = [
    {
      label: "Checker default",
      description: "run without --semantics",
      value: undefined,
    },
    ...SEMANTICS.map((semantics) => ({ label: semantics, value: semantics })),
  ];

  return vscode.window.showQuickPick(items, {
    title,
    placeHolder: "Semantics",
  });
}

/** Reads a setting that must be one of a fixed set of values. */
function readEnum<T extends string>(
  key: string,
  allowed: readonly T[],
): T | undefined {
  const value = vscode.workspace
    .getConfiguration("DSRV")
    .get<string>(key)
    ?.trim();
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
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

/** The input beside the model if there is one, otherwise whatever the user picks */
async function resolveInputFile(
  modelFile: string,
): Promise<string | undefined> {
  const sibling = siblingInputFile(modelFile);
  if (fs.existsSync(sibling)) {
    return sibling;
  }

  const picked = await vscode.window.showOpenDialog({
    title: `No ${path.basename(sibling)} beside the model. Choose an input file`,
    openLabel: "Run with this input",
    canSelectMany: false,
    filters: { "DSRV Input Files": ["input", "json5", "txt"] },
  });

  return picked?.[0]?.fsPath;
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
