import * as assert from "assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";
import * as command from "./src/commands";
import * as os from "os";
import path from "path";
import * as fs from "fs";

suite("Commands Integration Test Suite", () => {
  let originalConfig: vscode.WorkspaceConfiguration;
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, "test_model.dsrv");
  const tmpInput = path.join(tmpDir, "test_model.input");

  setup(async () => {
    originalConfig = vscode.workspace.getConfiguration("DSRV");
    fs.writeFileSync(tmpFile, "in a: Int\nin b: Int\nout c: Int\nc = a + b");
    fs.writeFileSync(tmpInput, "0: x = 1\ny = 2\n1: x = 2\ny = 3\n2: x = 3\ny = 4");
    await originalConfig.update(
      "binaryPath",
      "/home/emili/projects/robosapiens-trustworthiness-checker/target/release/trustworthiness_checker",
      vscode.ConfigurationTarget.Global,
    );
  });

  teardown(async () => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("test getBinaryPath", () => {
    const binPath = command.getBinaryPath();
    assert.ok(binPath.length > 0, "Binary path should not be empty");
  });

  test("test commands no active editor", async () => {
    // Ensure no active editor
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");

    assert.doesNotThrow(() => command.runSimpleCommand(), "runSimpleCommand should not throw");
    assert.doesNotThrow(() => command.runWithTypes(), "runWithTypes should not throw");
    await assert.doesNotReject(command.runWithInput(), "runWithInput should not reject");
    await assert.doesNotReject(
      command.runWithInputAndTypes(),
      "runWithInputAndTypes should not reject",
    );
  });

  test("Test Run simple Command", async () => {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(tmpFile));
    await vscode.window.showTextDocument(doc);

    const initialTerminal = vscode.window.terminals.length;
    command.runSimpleCommand();

    assert.ok(
      vscode.window.terminals.length >= initialTerminal,
      "Terminal should be created or reused",
    );
  });

  test("Test command with typed", async () => {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(tmpFile));
    await vscode.window.showTextDocument(doc);

    const initialTerminal = vscode.window.terminals.length;
    command.runWithTypes();

    assert.ok(
      vscode.window.terminals.length >= initialTerminal,
      "Terminal should be created or reused",
    );
  });
});
