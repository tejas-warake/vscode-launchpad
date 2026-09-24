import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('LaunchPad extension activated');

  // ── Sidebar Webview ──────────────────────────────────────────
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'launchpad.sidebar',
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ── Commands ─────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('launchpad.newConfig', () => {
      sidebarProvider.postMessage({ type: 'newConfig' });
    }),

    vscode.commands.registerCommand('launchpad.newTask', () => {
      sidebarProvider.postMessage({ type: 'newTask' });
    }),

    vscode.commands.registerCommand('launchpad.refresh', () => {
      sidebarProvider.postMessage({ type: 'refresh' });
    })
  );
}

export function deactivate() {}
