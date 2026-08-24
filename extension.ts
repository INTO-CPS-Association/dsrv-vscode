import * as vscode from 'vscode';
import * as path from 'path';
import { getChannel, initLogger, log, show } from './client/src/logger';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Trace } from 'vscode-languageclient/node';
import { runSimpleCommand, runWithInput, runWithInputAndTypes, runWithTypes } from './client/src/commands';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext): void {
  initLogger('DSRV');
  log('DSRV extension activated');
  show();

  const outputChannel = getChannel();

  const serverOptions: ServerOptions = {
    command: resolveServerExe(),
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

function resolveServerExe(): string {
  const configuredPath = vscode.workspace.getConfiguration('DSRV').get<string>('lspPath')?.trim();
  if (!configuredPath) {
    return 'dsrv-lsp';
  }

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const isPath =
    path.isAbsolute(configuredPath) ||
    configuredPath.startsWith('./') ||
    configuredPath.startsWith('../') ||
    configuredPath.includes('/') ||
    configuredPath.includes('\\');

  return workspaceRoot && isPath
    ? path.resolve(workspaceRoot, configuredPath)
    : configuredPath;
}
