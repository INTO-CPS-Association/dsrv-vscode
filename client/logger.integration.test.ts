import * as assert from "assert";
import { suite, test } from "mocha";
import * as vscode from "vscode";
import * as logger from "./src/logger";

suite("Logger Integration Test Suite", () => {
  test("test InitLogger Creates output channel and get channel", () => {
    logger.initLogger("TEST");
    const channel = logger.getChannel();
    assert.ok(channel, "Output channel should be created");
    assert.strictEqual(
      channel.name,
      "TEST",
      "Output channel name should be 'TEST'",
    );
  });

  test("test log", () => {
    logger.initLogger("TEST");
    logger.log("TEST Log");

    assert.ok(true, "Log method should execute without errors");
  });

  test("test show", () => {
    logger.initLogger("TEST");
    logger.show();
    assert.ok(true, "Show method should execute without errors");
  });
});
