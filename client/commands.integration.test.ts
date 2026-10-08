import * as assert from "assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";
import * as command from "./src/commands";
import * as os from "os";
import path from "path";
import * as fs from "fs";

suite("Commands Integration Test Suite", () => {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, "test_model.dsrv");
  const tmpInput = path.join(tmpDir, "test_model.input");

  setup(async () => {
    fs.writeFileSync(tmpFile, "in a: Int\nin b: Int\nout c: Int\nc = a + b");
    fs.writeFileSync(tmpInput, "0: x = 1\ny = 2\n1: x = 2\ny = 3\n2: x = 3\ny = 4");
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

  test("builds the checker arguments", () => {
    const args = command.buildArgs(
      "/tmp/model.dsrv",
      "/tmp/model.input",
      "typed-untimed",
    );
    const plain = args.map((a) => (typeof a === "string" ? a : a.value));

    assert.deepStrictEqual(plain, [
      "/tmp/model.dsrv",
      "--input-file",
      "/tmp/model.input",
      "--language",
      "dsrv",
      "--semantics",
      "typed-untimed",
      "--output-stdout",
    ]);
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

  test("creates a dsrv task for the model", () => {
    const task = command.createRunTask(
      "/tmp/model.dsrv",
      "/tmp/model.input",
      "untimed",
      "/opt/trustworthiness_checker",
    );

    assert.strictEqual(task.definition.type, "dsrv");
    assert.strictEqual(task.source, "DSRV");
    assert.ok(task.name.includes("model.dsrv"));
  });

  test("carries the semantics in the task definition", () => {
    const task = command.createRunTask(
      "/tmp/model.dsrv",
      "/tmp/model.input",
      "typed-untimed",
      "/opt/trustworthiness_checker",
    );

    assert.strictEqual(task.definition.semantics, "typed-untimed");
  });
});
