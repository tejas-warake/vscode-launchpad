import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { ConfigService } from './services/ConfigService';
import { TaskService } from './services/TaskService';

export function activate(context: vscode.ExtensionContext) {
  console.log('LaunchPad extension activated');

  // ── Services ─────────────────────────────────────────────────
  const configService = new ConfigService();
  const taskService = new TaskService();

  // ── Sidebar Webview ──────────────────────────────────────────
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    context,
    configService,
    taskService
  );

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

    vscode.commands.registerCommand('launchpad.refresh', async () => {
      await sidebarProvider.sendInitialData();
    })
  );

  // ── Cleanup ──────────────────────────────────────────────────
  context.subscriptions.push({
    dispose: () => {
      configService.dispose();
      taskService.dispose();
    },
  });
}

export function deactivate() {}
