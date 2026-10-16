import { deepStrictEqual, strictEqual, doesNotReject } from "assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";

import {
  buildArgs,
  createRunTask,
  effectiveRuntime,
  run,
  runWith,
  statusText,
} from "./src/commands";

function flat(args: ReturnType<typeof buildArgs>): string [] {
  return args.map((arg) => (typeof arg === "string" ? arg : arg.value));
}

suite("buildArgs", () => {
  test("omits both flags when nothing is configured", () => {
    deepStrictEqual(flat(buildArgs("/m/model.dsrv", "/m/model.input")), [
      "/m/model.dsrv",
      "--input-file",
      "/m/model.input",
      "--language",
      "dsrv",
      "--output-stdout",
    ]);
  });

  test("passes the semantics when one is configured", () => {
    const args = flat(
      buildArgs("/m/model.dsrv", "/m/model.input", "typed-untimed"),
    );
    deepStrictEqual(args.slice(5, 7), ["--semantics", "typed-untimed"]);
    strictEqual(args.includes("--runtime"), false);
  });

  test("passes the runtime when one is configured", () => {
    const args = flat(
      buildArgs("/m/model.dsrv", "/m/model.input", undefined, "dataflow"),
    );
    deepStrictEqual(args.slice(5, 7), ["--runtime", "dataflow"]);
    strictEqual(args.includes("--semantics"), false);
  });

  test("puts --output-stdout last with both flags present", () => {
    const args = flat(
      buildArgs("/m/model.dsrv", "/m/model.input", "causal", "semi-sync"),
    );
    deepStrictEqual(args, [
      "/m/model.dsrv",
      "--input-file",
      "/m/model.input",
      "--language",
      "dsrv",
      "--semantics",
      "causal",
      "--runtime",
      "semi-sync",
      "--output-stdout",
    ]);
  });
});

suite("effectiveRuntime", () => {
  test("leaves a configured runtime alone", () => {
    strictEqual(effectiveRuntime("typed-untimed", "dataflow"), "dataflow");
  });

  test("stays unset when nothing is configured", () => {
    strictEqual(effectiveRuntime("typed-untimed", undefined), undefined);
  });

  test("selects semi-sync for causal when nothing is configured", () => {
    strictEqual(effectiveRuntime("causal", undefined), "semi-sync");
  });

  test("overrides a configured runtime that causal cannot use", () => {
    strictEqual(effectiveRuntime("causal", "dataflow"), "semi-sync");
  });
});

suite("createRunTask", () => {
  test("is a dsrv task that names the model and records both choices", () => {
    const task = createRunTask(
      "/m/model.dsrv",
      "/m/model.input",
      "causal",
      "trustworthiness_checker",
      "semi-sync",
    );

    strictEqual(task.definition.type, "dsrv");
    strictEqual(task.source, "DSRV");
    strictEqual(task.name.includes("model.dsrv"), true);
    strictEqual(task.definition.semantics, "causal");
    strictEqual(task.definition.runtime, "semi-sync");
  });

  test("records null rather than undefined when a choice is unset", () => {
    const task = createRunTask(
      "/m/model.dsrv",
      "/m/model.input",
      undefined,
      "trustworthiness_checker",
    );

    strictEqual(task.definition.semantics, null);
    strictEqual(task.definition.runtime, null);
  });
});

suite("statusText", () => {
  test("names the checker's default rather than guessing it", () => {
    strictEqual(statusText(undefined, undefined), "DSRV: checker default");
  });

  test("shows the semantics alone when no runtime applies", () => {
    strictEqual(statusText("typed-untimed", undefined), "DSRV: typed-untimed");
  });

  test("shows both when a runtime applies", () => {
    strictEqual(statusText("causal", "semi-sync"), "DSRV: causal · semi-sync");
  });
});

suite("with no active editor", () => {
  setup(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("run reports instead of throwing", async () => {
    await doesNotReject(run());
  });

  test("runWith reports instead of opening a picker", async function () {
    this.timeout(5000);
    await doesNotReject(runWith());
  });
});
