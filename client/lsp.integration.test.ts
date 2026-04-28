import * as assert from "assert";
import { suite, test, Done } from "mocha";
import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

suite("Language Server Integration Test Suite", () => {
  const tempDir = os.tmpdir();
  const validFileUntyped = path.join(tempDir, "valid_model.dsrv");
  const validFileTyped = path.join(tempDir, "valid_model_typed.dsrv");
  const invalidFileUntyped = path.join(tempDir, "invalid_model.dsrv");
  const invalidFileTyped = path.join(tempDir, "invalid_model_typed.dsrv");
  const inputFile = path.join(tempDir, "valid_model.input");

  setup(async () => {
    fs.writeFileSync(validFileUntyped, "in a\nin b\nout c\nc = a + b");

    fs.writeFileSync(
      validFileTyped,
      "in a: Int\nin b: Int\nout c: Int\nc = a + b",
    );

    fs.writeFileSync(invalidFileUntyped, "in a\nin b\nout c\nc = a + b +"); // Syntax error

    fs.writeFileSync(
      invalidFileTyped,
      "in a: Int\nin b: Str\nout c: Int\nc = a + b",
    ); // Type error

    fs.writeFileSync(
      inputFile,
      "0: x = 1\ny = 2\n1: x = 2\ny = 3\n2: x = 3\ny = 4",
    );

    const config = vscode.workspace.getConfiguration("DSRV");
    await config.update(
      "binaryPath",
      "/home/emili/projects/robosapiens-trustworthiness-checker/target/release/trustworthiness_checker",
      vscode.ConfigurationTarget.Global,
    );
  });

  teardown(async () => {
    if (fs.existsSync(validFileUntyped)) fs.unlinkSync(validFileUntyped);
    if (fs.existsSync(validFileTyped)) fs.unlinkSync(validFileTyped);
    if (fs.existsSync(invalidFileUntyped)) fs.unlinkSync(invalidFileUntyped);
    if (fs.existsSync(invalidFileTyped)) fs.unlinkSync(invalidFileTyped);
    if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);

    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("Test diagnostic for invalid files", async () => {
    let doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(invalidFileUntyped),
    );
    await vscode.window.showTextDocument(doc);

    await waitForDiagnostics(doc.uri);
    // await sleep(100);

    let diagnostic = vscode.languages.getDiagnostics(doc.uri);

    assert.ok(
      diagnostic.length > 0,
      "Language Server should return at least one diagnostic error for invalid syntax, got " +
        diagnostic.length,
    );

    doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(invalidFileTyped),
    );
    await vscode.window.showTextDocument(doc);

    await waitForDiagnostics(doc.uri);

    diagnostic = vscode.languages.getDiagnostics(doc.uri);

    assert.ok(
      diagnostic.length > 0,
      "Language Server should return at least one diagnostic error for type errors, got " +
        diagnostic.length,
    );
  });

  test("Test no erros on valid files", async () => {
    // Test untyped valid file
    let doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(validFileUntyped),
    );
    await vscode.window.showTextDocument(doc);

    await sleep(500);
    let diagnostic = vscode.languages.getDiagnostics(doc.uri);

    assert.equal(
      diagnostic.length,
      0,
      "Language Server should not return errors for valid syntax",
    );

    // Test typed valid file
    doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(validFileTyped),
    );
    await vscode.window.showTextDocument(doc);

    await sleep(500);

    diagnostic = vscode.languages.getDiagnostics(doc.uri);

    assert.equal(
      diagnostic.length,
      0,
      "Language Server should not return errors for valid typed syntax",
    );
  });

  test("Test provide Hover information", async () => {
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(validFileTyped),
    );
    const editor = await vscode.window.showTextDocument(doc);

    await sleep(500);

    const pos = new vscode.Position(1, 2); // Position over 'a' variable

    const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
      "vscode.executeHoverProvider",
      doc.uri,
      pos,
    );

    // Check if the hover content contains the expected type string
    const contents = hover[0].contents
      .map((c) =>
        typeof c === "string" ? c : (c as vscode.MarkdownString).value,
      )
      .join(" ");

    // console.log("Hover contents:", contents);

    assert.ok(
      contents.includes("in b: Int"),
      "Hover information should include the type of variable 'b'",
    );
  });

  test("Test provide auto completion suggestions", async () => {
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(invalidFileUntyped),
    );


    const editor = await vscode.window.showTextDocument(doc);

    await waitForDiagnostics(doc.uri);
    // await sleep(10000);

    // Simulate the user manually typing 'd' at the end of the file
    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(3, 11), "d");
    });

    // Wait a brief moment for the textDocument/didChange event to sync with the Rust server
    await sleep(500);

    // Position exactly after the newly typed 'd'
    const pos = new vscode.Position(3, 12);

    const completions = await vscode.commands.executeCommand<
      vscode.CompletionList | vscode.CompletionItem[]
    >("vscode.executeCompletionItemProvider", doc.uri, pos);

    // console.log("Completion suggestions:", JSON.stringify(completions, null, 2));
    await sleep(500);
    const items = Array.isArray(completions) ? completions : completions.items;

    assert.ok(
      items.length >= 1,
      "Should provide at least one completion suggestion but got " +
        items.length,
    );

    const labels = items.map((item) =>
      typeof item.label === "string" ? item.label : item.label.label,
    );

    // Check that it includes 'default' as a suggestion, as the editor add a d and therefore the function 'default' should be suggested
    assert.ok(
      labels.includes("default"),
      "Completion suggestions should include 'default' for variables in scope, but got: " +
        labels.join(", "),
    );
  });
});

// Helper function to wait for the language server to process files
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDiagnostics(uri: vscode.Uri, timeout = 3000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const diags = vscode.languages.getDiagnostics(uri);
    if (diags && diags.length > 0) {
      return;
    }
    await sleep(100);
  }

  throw new Error("Timed out waiting for diagnostics");
}
