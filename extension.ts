// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getChannel, initLogger, log, show } from './client/src/logger';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Trace } from 'vscode-languageclient/node';
import path from 'path';
import { runSimpleCommand, runWithInput, runWithInputAndTypes, runWithTypes } from './client/src/commands';
import * as fs from 'fs';

let client: LanguageClient; // Language client instance for communicating with the language server

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  initLogger('DSRV');
  log("DSRV extension activated");
  show();

  const outputChannel = getChannel();


  const serverOptions: ServerOptions = {
    command: resolveServerExe(context),
    args: [],
    transport: TransportKind.stdio,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'dsrv' }],
    outputChannel: outputChannel,
  };

  client = new LanguageClient('dsrv-lsp', 'DSRV LSP', serverOptions, clientOptions);
  client.start();
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

export function deactivate() { }


// Helper function to get the path to the binary, checking both the config and the default locations.
function resolveServerExe(context: vscode.ExtensionContext): string {
  const debugPath = context.asAbsolutePath(path.join('target', 'debug', 'dsrv-lsp'));
  const releasePath = context.asAbsolutePath(path.join('target', 'release', 'dsrv-lsp'));

  if (fs.existsSync(debugPath)) {
    return debugPath;
  }

  if (fs.existsSync(releasePath)) {
    return releasePath;
  }

  throw new Error(`Could not find dsrv-lsp in ${debugPath} or ${releasePath}`);

}