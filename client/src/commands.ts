import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export function getBinaryPath(): string {
  const config = vscode.workspace.getConfiguration("DSRV");
  let binaryPath = config.get<string>('binaryPath') ?? './target/release/trustworthiness_checker';

  if (binaryPath.startsWith('./') && vscode.workspace.workspaceFolders) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    return path.join(rootPath, binaryPath);
  }

  return binaryPath;
}

function executeCommand(modelFile: string, inputFile: string) {
  const binPath = getBinaryPath();
  const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('DSRV Terminal');

  // adds quotes around the path and escape any single quotes in the path
  const quote = (p: string) => `'${p.replace(/'/g, "'\\''")}'`;

  // Builds the command to run the binary with the appropriate arguments, ensuring that paths with spaces are properly handled by quoting them.
  const command = `${quote(binPath)} --parser lalr --language dsrv --semantics untimed --input-file ${quote(inputFile)} ${quote(modelFile)}`;

  terminal.show();
  terminal.sendText(command);

}


export async function runWithInput() {
  const editor = vscode.window.visibleTextEditors.find(
    e => e.document.uri.scheme === "file"
  );
  if (!editor) { return; }

  // Get the Model file as the current file, 
  const filePath = editor.document.uri.fsPath;

  const inputFile = await vscode.window.showOpenDialog({
    openLabel: 'Select Input File',
    filters: { 'Input Files': ['input', 'txt'] }
  });

  if (inputFile && inputFile[0]) {
    const selectedInput = inputFile[0].fsPath;
    
    // Check if the selected input file exists before executing the command, and show an error message if it doesn't.
    if (!fs.existsSync(selectedInput)) {
      vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
      return;
    }
    executeCommand(filePath, selectedInput);
  }
}

//Function for a simple version that assumes an input file with the same name exist in the folder.
export function runSimpleCommand() {
  const editor = vscode.window.visibleTextEditors.find(
    e => e.document.uri.scheme === "file"
  );
  if (!editor) { return; }

  // Derive the input file path from the current file path by replacing the extension with .input
  const filePath = editor.document.uri.fsPath;
  const inputFile = filePath.replace(/\.[^/.]+$/, "") + ".input"; // Replace the file path with the corresponding .input file path

  if (!fs.existsSync(inputFile)) {
    vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
    return;
  }

  executeCommand(filePath, inputFile);

}

export function runWithTypes() {
  const editor = vscode.window.visibleTextEditors.find(
    e => e.document.uri.scheme === "file"
  );
  if (!editor) { return; }
  
  // Derive the input file path from the current file path by replacing the extension with .input
  const filePath = editor.document.uri.fsPath;
  const inputFile = filePath.replace(/\.[^/.]+$/, "") + ".input"; // Replace the file path with the corresponding .input file path
  
  if (!fs.existsSync(inputFile)) {
    vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
    return;
  }
  
  executeTypedCommand(filePath, inputFile);
  
}
export async function runWithInputAndTypes() {
  const editor = vscode.window.visibleTextEditors.find(
    e => e.document.uri.scheme === "file"
  );
  if (!editor) { return; }

  // Get the Model file as the current file, 
  const filePath = editor.document.uri.fsPath;

  const inputFile = await vscode.window.showOpenDialog({
    openLabel: 'Select Input File',
    filters: { 'Input Files': ['input', 'txt'] }
  });

  if (inputFile && inputFile[0]) {
    const selectedInput = inputFile[0].fsPath;
    
    // Check if the selected input file exists before executing the command, and show an error message if it doesn't.
    if (!fs.existsSync(selectedInput)) {
      vscode.window.showErrorMessage(`Input file not found: ${inputFile}`);
      return;
    }
    executeTypedCommand(filePath, selectedInput);
  }
}

function executeTypedCommand(modelFile: string, inputFile: string) {
  const binPath = getBinaryPath();
  const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('DSRV Terminal');

  // adds quotes around the path and escape any single quotes in the path
  const quote = (p: string) => `'${p.replace(/'/g, "'\\''")}'`;

  // Builds the command to run the binary with the appropriate arguments, ensuring that paths with spaces are properly handled by quoting them.
  const command = `${quote(binPath)} --parser lalr --language dsrv --semantics typed-untimed --input-file ${quote(inputFile)} ${quote(modelFile)}`;

  terminal.show();
  terminal.sendText(command);

}




// Version two - Using the Task API to execute the command, which is safer but more complicated than using the terminal directly.
// const task = new vscode.Task(
//   { type: 'dsrv' },
//   vscode.TaskScope.Workspace,
//   'DSRV Execution',
//   'dsrv',
//   new vscode.ProcessExecution(
//     binPath,
//     [
//       '--parser', 'lalr',
//       '--language', 'dsrv',
//       '--input-file', inputFile,
//       filePath
//     ]
//   )
// );
// vscode.tasks.executeTask(task);


// Original code using terminal, now replaced by Task API for better safety
// const terminal = vscode.window.activeTerminal || vscode.window.createTerminal("DSRV");
// terminal.show();

// terminal.sendText(`"${binPath}" --parser lalr --language dsrv --input-file "${inputFile}" "${filePath}"`);
