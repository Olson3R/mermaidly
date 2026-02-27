import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // The extension contributes markdown preview scripts and styles
  // via package.json, so no additional activation logic is needed.
  console.log('Mermaidly extension activated');
}

export function deactivate() {
  // Nothing to clean up
}
