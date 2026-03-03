// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as langData from "./snippets/language-data.json";
import {getChannel, initLogger, log, show } from './client/src/logger';
import {LanguageClient, LanguageClientOptions, ServerOptions, TransportKind, Trace} from 'vscode-languageclient/node';
import path from 'path';

let client: LanguageClient; // Language client instance for communicating with the language server

// const snippets = langData.snippets; // File with snippets for the completion provider 

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  initLogger('DynSRV');
  log("DynSRV extension activated");
  show();  
  
  const outputChannel = getChannel();
  
  const serverExe = context.asAbsolutePath(path.join('server', 'DynSRV-lsp', 'target', 'debug', 'dynsrv-lsp'));
  
  const serverOptions: ServerOptions = {
    command: serverExe,
    args: [],
    transport: TransportKind.stdio,
  };
  
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{language: 'dynsrv'}],
    outputChannel: outputChannel,
  };
  
  client = new LanguageClient('dynsrv-lsp', 'DynSRV LSP', serverOptions, clientOptions);
  client.start();
  client.setTrace(Trace.Verbose);
  context.subscriptions.push(client);  
  
  
  
  
  
  
  // -------------------- Initial stuff - Will problably be changed ---------------------
  
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('dynsrv-vscode.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from dynsrv-vscode!');
  });
  context.subscriptions.push(disposable);
  // context.subscriptions.push(
  //   vscode.languages.registerCompletionItemProvider(
  //     'dynsrv', new dynsrvCompletionItemProvider(), '.')
  // );

  // const diagnostics = vscode.languages.createDiagnosticCollection("dynsrv");
  // context.subscriptions.push(diagnostics);

  // const refresh = async (document: vscode.TextDocument) => {
  //   if (document.languageId === "dynsrv") {
  //     const diags = server.validateDynSRVFile(document.uri.fsPath);
  //     const convertedDiags = (await diags).map(diag =>
  //       new vscode.Diagnostic(
  //         new vscode.Range(
  //           new vscode.Position(diag.range.start.line, diag.range.start.character),
  //           new vscode.Position(diag.range.end.line, diag.range.end.character)
  //         ),
  //         diag.message,
  //         diag.severity as vscode.DiagnosticSeverity
  //       )
  //     );
  //     diagnostics.set(document.uri, convertedDiags);
  //   }
  // };

  // context.subscriptions.push(
  //   vscode.workspace.onDidChangeTextDocument(e => refresh(e.document)),
  //   vscode.workspace.onDidSaveTextDocument(refresh),
  //   vscode.window.onDidChangeActiveTextEditor(editor => {
  //     if (editor) { refresh(editor.document); }
  //   })
  // );

  // if (vscode.window.activeTextEditor) {
  //   refresh(vscode.window.activeTextEditor.document);
  // }
}

// class dynsrvCompletionItemProvider implements vscode.CompletionItemProvider {
//   public provideCompletionItems(
//     document: vscode.TextDocument,
//     position: vscode.Position,
//     token: vscode.CancellationToken,
//     context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
//     const range = document.getWordRangeAtPosition(position);
//     const prefix = document.getText(range);


//     const snippetItems = langData.snippets.map(snip => {
//       const item = new vscode.CompletionItem(snip.prefix, vscode.CompletionItemKind.Snippet);
//       item.range = range;
//       item.filterText = snip.prefix;
//       item.insertText = new vscode.SnippetString(snip.body.join('\n'));
//       item.detail = snip.description;

//       return item;
//     });

//     return [
//       ...snippetItems
//     ];
//   }
// }

// This method is called when your extension is deactivated
export function deactivate() { }
