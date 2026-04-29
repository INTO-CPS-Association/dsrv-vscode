import * as assert from "assert";
import { suite, test, Done } from "mocha";
import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

suite("Language Server Integration Test Suite", () => {
  const tempDir = os.tmpdir();
  // Define test file paths
  const files = {
    validUntyped: path.join(tempDir, "valid_untyped.dsrv"),
    invalidUntyped: path.join(tempDir, "invalid_untyped.dsrv"),
    validTyped: path.join(tempDir, "valid_typed.dsrv"),
    invalidTyped: path.join(tempDir, "invalid_typed.dsrv"),
    // inputFile: path.join(tempDir, "input_file.dsrv"),
  };

  setup(async () => {
    // Create test files with appropriate content
    fs.writeFileSync(files.validUntyped, "in a\nin b\nout c\nc = a + b"); // Valid untyped file
    fs.writeFileSync(files.invalidUntyped, "in a\nin b\nout c\nc = a + b +"); // Syntax error
    fs.writeFileSync(files.validTyped, "in a: Int\nin b: Int\nout c: Int\nc = a + b"); // Valid typed file
    fs.writeFileSync(files.invalidTyped, "in a: Int\nin b: Str\nout c: Int\nc = a + b"); // Type error
    // fs.writeFileSync(files.inputFile, "0: x = 1\ny = 2\n1: x = 2\ny = 3\n2: x = 3\ny = 4"); // Input file for testing

    await vscode.extensions.getExtension("dsrv")?.activate();
  });

  teardown(async () => {
    // Clean up test files
    Object.values(files).forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });

    // Close all editors to ensure a clean state for the next test run
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  // test("Diagnostic - Valid Untyped File - Reports no error")
  suite("Diagnostic", () => {
    test("Valid Untyped File - Reports no errors", async () => {
      let doc = await openDoc(files.validUntyped);
      await waitForDiagnostics(doc.uri, 0);

      const diagnostic = vscode.languages.getDiagnostics(doc.uri);

      // console.log(`Diagnostics for valid untyped file: ${diagnostic.length}`);

      // Assert that there are no diagnostics for the valid untyped file
      assert.ok(
        diagnostic.length == 0,
        `Expected no diagnostics for valid untyped file, but got ${diagnostic.length}`,
      );
    });

    test("Valid Typed File - Reports no errors", async () => {
      let doc = await openDoc(files.validTyped);
      await waitForDiagnostics(doc.uri, 0);

      const diagnostic = vscode.languages.getDiagnostics(doc.uri);

      // console.log(`Diagnostics for valid typed file: ${diagnostic.length}`);

      // Assert that there are no diagnostics for the valid untyped file
      assert.ok(
        diagnostic.length == 0,
        `Expected no diagnostics for valid untyped file, but got ${diagnostic.length}`,
      );
    });

    test("Invalid Untyped File - Report syntax error", async () => {
      let doc = await openDoc(files.invalidUntyped);
      await waitForDiagnostics(doc.uri);

      const diagnostic = vscode.languages.getDiagnostics(doc.uri);

      // console.log(`Diagnostics for invalid untyped file: ${diagnostic.length}`);

      // Assert that there are no diagnostics for the valid untyped file
      assert.ok(
        diagnostic.length > 0,
        `Expected diagnostics for invalid untyped file, but got ${diagnostic.length}`,
      );

      // Assert that the diagnostic message contains "Syntax error:"
      const content = diagnostic[0].message;
      assert.ok(
        content.includes("Syntax error:"),
        `Expected diagnostic message to include "Syntax error:", but got: ${content}`,
      );
    });

    test("Invalid Typed File - Reports type error", async () => {
      let doc = await openDoc(files.invalidTyped);
      await waitForDiagnostics(doc.uri);

      const diagnostic = vscode.languages.getDiagnostics(doc.uri);

      // console.log(`Diagnostics for invalid typed file: ${diagnostic.length}`);

      // Assert that there are no diagnostics for the valid untyped file
      assert.ok(
        diagnostic.length > 0,
        `Expected diagnostics for invalid typed file, but got ${diagnostic.length}`,
      );

      // Assert that the diagnostic message contains "Type error:"
      const content = diagnostic[0].message;
      assert.ok(
        content.includes("Type error:"),
        `Expected diagnostic message to include "Type error:", but got: ${content}`,
      );
    });
  });

  suite("Hover", () => {
    test("Typed variable - Shows type Information", async () => {
      const doc = await openDoc(files.validTyped);
      await waitForDiagnostics(doc.uri, 0);

      const pos = new vscode.Position(1, 3); // Position over 'b' variable
      const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        doc.uri,
        pos,
      );

      // Check that hover information is returned
      assert.ok(hover.length > 0, "Expected hover information but got none");

      const contents = hover[0].contents
        .map((c) => (typeof c === "string" ? c : (c as vscode.MarkdownString).value))
        .join(" ");

      // console.log("Hover contents:", contents);

      // Check that the hover information includes the type of variable 'b'
      assert.ok(
        contents.includes("in b: Int"),
        "Hover information should include the type of variable 'b', but got: " + contents,
      );

      // Check that the hover information also includes the description of input stream
      assert.ok(
        contents.includes("Declares an input stream"),
        "Hover information should include the description of variable 'b', but got: " + contents,
      );
    });

    test("Function - Shows function information", async () => {
      const doc = await openDoc(files.validTyped);
      await waitForDiagnostics(doc.uri, 0);

      const editor = await vscode.window.showTextDocument(doc);
      await editor.edit((editBuilder) => {
        editBuilder.delete(new vscode.Range(new vscode.Position(3, 8), new vscode.Position(3, 9)));
        editBuilder.insert(new vscode.Position(3, 7), " abs(a)");
      });

      const pos = new vscode.Position(3, 9);
      const hover = await vscode.commands.executeCommand<vscode.Hover[]>(
        "vscode.executeHoverProvider",
        doc.uri,
        pos,
      );

      // Check that hover information is returned
      assert.ok(hover.length > 0, "Expected hover information but got none");

      const contents = hover[0].contents
        .map((c) => (typeof c === "string" ? c : (c as vscode.MarkdownString).value))
        .join(" ");

      // console.log("Hover contents for function:", contents);

      // Check that the hover information includes the function signature of abs
      assert.ok(
        contents.includes("abs(e)"),
        "Expected hover information to include function signature 'abs(e)', but got: " + contents,
      );

      // Check that the hover information also includes the description of abs
      assert.ok(
        contents.includes("Returns the absolute value of the expression"),
        "Expected hover information to include function description, but got: " + contents,
      );
    });
  });

  suite("Auto Completion", () => {
    test("Provides functions suggestion in scope", async () => {
      const doc = await openDoc(files.invalidUntyped);
      const editor = await vscode.window.showTextDocument(doc);

      await waitForDiagnostics(doc.uri, 1);

      await editor.edit((editBuidler) => {
        editBuidler.insert(new vscode.Position(3, 11), "d");
      });

      await sleep(100); // Wait for the textDocument/didChange event to sync with the Rust server

      const pos = new vscode.Position(3, 12);

      const completions = await vscode.commands.executeCommand<
        vscode.CompletionList | vscode.CompletionItem[]
      >("vscode.executeCompletionItemProvider", doc.uri, pos);

      const items = Array.isArray(completions) ? completions : completions.items;

      assert.ok(
        items.length >= 1,
        "Should provide at least one completion suggestion but got " + items.length,
      );

      const labels = items.map((item) =>
        typeof item.label === "string" ? item.label : item.label.label,
      );

      // Check that it includes 'default' as a suggestion, as the editor add a d and therefore the function 'default' should be suggested
      assert.ok(
        labels.includes("default"),
        "Completion suggestions should include 'default' for scope, but got: " + labels.join(", "),
      );
    });
  });
});

// Helper Functions
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wait for diagnostics to appear for a given document URI, optionally checking for an expected count of diagnostics
async function waitForDiagnostics(uri: vscode.Uri, expectedCount?: number, timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const diags = vscode.languages.getDiagnostics(uri);

    if (expectedCount !== undefined) {
      if (diags.length === expectedCount) return;
    } else {
      if (diags.length > 0) return;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for diagnostics (expected: ${expectedCount})`);
}
// Helper function to open a document and show it in the editor
async function openDoc(file: string) {
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
  await vscode.window.showTextDocument(doc);
  return doc;
}
