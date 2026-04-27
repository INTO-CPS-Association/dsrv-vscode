import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import * as logger from './logger';

suite('Logger Integration Test Suite', () => {
  test("test InitLogger Creates output channel", () => {
    logger.initLogger('TEST');
    const channel = logger.getChannel();
    assert.ok(channel, "Output channel should be created");
    assert.strictEqual(channel.name, 'TEST', "Output channel name should be 'TEST'");

  });
});