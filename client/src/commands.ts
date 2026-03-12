import * as vscode from 'vscode';
import * as path from 'path';


export function getBinaryPath(): string {
  const config = vscode.workspace.getConfiguration("DSRV");
  let binaryPath = config.get<string>('binaryPath') || './target/release/trustworthiness_checker';

  if (binaryPath.startsWith('./') && vscode.workspace.workspaceFolders) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return path.join(rootPath, binaryPath);
  }

  return binaryPath;
}