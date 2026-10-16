import * as vscode from 'vscode';
import { getChannel, initLogger, log } from './client/src/logger';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { initBinaries, resolveBinary } from './client/src/binaries';
import { run, runWith, selectSemantics, registerStatusBar } from './client/src/commands';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext): void {
  initLogger('DSRV');
  initBinaries(context);
  log('DSRV extension activated');

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
  context.subscriptions.push(client);

  context.subscriptions.push(
    vscode.commands.registerCommand('DSRV.run', run),
    vscode.commands.registerCommand('DSRV.runWith', runWith),
    vscode.commands.registerCommand('DSRV.selectSemantics', selectSemantics),
  );

  registerStatusBar(context);
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
