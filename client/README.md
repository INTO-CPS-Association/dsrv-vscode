# Language Client
This is the client for the language server. The client handles the communication with the server and provides an interface for the user to interact with the server. It's implemented in TypeScript and uses the `vscode-languageclient` library to communicate with the server.

The main entry point for the client is the `activate` function, which is called when the extension is activated. The `activate` function creates a new instance of the `LanguageClient` class and starts the client and opens up the communication with the server.

To run the client, you can use the extension development host in Visual Studio Code, which can be started by pressing `F5` in the `main.ts` file. This will open a new instance of Visual Studio Code with the extension loaded, allowing you to test the client and its communication with the server.

