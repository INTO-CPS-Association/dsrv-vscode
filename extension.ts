import * as vscode from 'vscode';
import * as path from 'path';
import { getChannel, initLogger, log, show } from './client/src/logger';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Trace } from 'vscode-languageclient/node';
import { runSimpleCommand, runWithInput, runWithInputAndTypes, runWithTypes } from './client/src/commands';
import { initBinaries, resolveBinary } from './client/src/binaries';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext): void {
  initLogger('DSRV');
  initBinaries(context);
  log('DSRV extension activated');
  show();

  const outputChannel = getChannel();

  const lsp = resolveBinary('dsrv-lsp');
  const serverOptions: ServerOptions = {
    command: lsp.command,
    args: [],
    transport: TransportKind.stdio,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'dsrv' }],
    outputChannel,
  };

  client = new LanguageClient('dsrv-lsp', 'DSRV LSP', serverOptions, clientOptions);
  void client.start().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`Failed to start dsrv-lsp: ${message}`);
    void vscode.window.showErrorMessage(`Failed to start dsrv-lsp: ${message}`);
  });
  client.setTrace(Trace.Verbose);
  context.subscriptions.push(client);

  const commands = [
    vscode.commands.registerCommand('DSRV.runCurrentFile', runSimpleCommand),
    vscode.commands.registerCommand('DSRV.runWithInput', runWithInput),
    vscode.commands.registerCommand('DSRV.runWithTypes', runWithTypes),
    vscode.commands.registerCommand('DSRV.runWithInputAndTypes', runWithInputAndTypes),
  ];

  context.subscriptions.push(...commands);
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
