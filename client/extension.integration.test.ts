import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as extension from '../extension';
import * as vscode from 'vscode';

suite('Extension Unit Test Suite', () => {
  test('deactivate should execute without throwing', () => {
    assert.doesNotThrow(() => extension.deactivate());
  });

  test('activate registers the language client and commands', async () => {
    const expectedCommands = [
      'DSRV.runCurrentFile',
      'DSRV.runWithInput',
      'DSRV.runWithTypes',
      'DSRV.runWithInputAndTypes',
    ];
    let commands = await vscode.commands.getCommands(true);

    if (!expectedCommands.every((command) => commands.includes(command))) {
      const mockContext: any = { subscriptions: [] };
      assert.doesNotThrow(() => extension.activate(mockContext));
      assert.ok(mockContext.subscriptions.length >= 5);
      commands = await vscode.commands.getCommands(true);
    }

    for (const command of expectedCommands) {
      assert.ok(commands.includes(command), `Expected ${command} to be registered`);
    }
  });
});
