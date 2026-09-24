import * as vscode from 'vscode';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../../shared/protocol';
import { ConfigService } from '../services/ConfigService';
import { TaskService } from '../services/TaskService';
import { EditorPanelManager } from './EditorPanelManager';

/**
 * Provides the sidebar webview for the Debug panel.
 * Handles HTML generation, CSP, and bidirectional message passing.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _configService: ConfigService,
    private readonly _taskService: TaskService,
    private readonly _editorPanel: EditorPanelManager
  ) {
    // Live-sync: push updates when files change externally
    this._configService.onDidChange((configs) => {
      this.postMessage({ type: 'configsUpdated', configs });
    });

    this._taskService.onDidChange((tasks) => {
      this.postMessage({ type: 'tasksUpdated', tasks });
    });
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this._handleMessage(message);
      }
    );
  }

  /** Send a typed message to the webview. */
  public postMessage(message: ExtensionToWebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  /** Read configs + tasks and push to the webview. */
  public async sendInitialData() {
    const [configs, tasks] = await Promise.all([
      this._configService.getConfigs(),
      this._taskService.getTasks(),
    ]);
    this.postMessage({ type: 'init', configs, tasks });
  }

  private async _handleMessage(message: WebviewToExtensionMessage) {
    switch (message.type) {
      case 'ready':
        await this.sendInitialData();
        break;

      // ── Config Actions ───────────────────────────────────────
      case 'createConfig':
        this._editorPanel.openNewConfig();
        break;

      case 'runConfig':
        await this._configService.runConfig(message.name);
        break;

      case 'deleteConfig': {
        const configs = await this._configService.getConfigs();
        const name = configs[message.index]?.name ?? 'this configuration';
        const confirm = await vscode.window.showWarningMessage(
          `Delete "${name}"?`,
          { modal: true },
          'Delete'
        );
        if (confirm === 'Delete') {
          await this._configService.deleteConfig(message.index);
        }
        break;
      }

      case 'duplicateConfig':
        await this._configService.duplicateConfig(message.index);
        break;

      case 'editConfig':
        this._editorPanel.openEditConfig(message.index);
        break;

      // ── Task Actions ─────────────────────────────────────────
      case 'createTask':
        this._editorPanel.openNewTask();
        break;

      case 'runTask':
        await this._taskService.runTask(message.label);
        break;

      case 'deleteTask': {
        const tasks = await this._taskService.getTasks();
        const label = tasks[message.index]?.label ?? 'this task';
        const confirm = await vscode.window.showWarningMessage(
          `Delete task "${label}"?`,
          { modal: true },
          'Delete'
        );
        if (confirm === 'Delete') {
          await this._taskService.deleteTask(message.index);
        }
        break;
      }

      case 'duplicateTask':
        await this._taskService.duplicateTask(message.index);
        break;

      case 'editTask':
        this._editorPanel.openEditTask(message.index);
        break;

      default:
        console.log('[LaunchPad] Unhandled webview message:', message);
    }
  }

  private _getLaunchJsonUri(): vscode.Uri | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0];
    return folder
      ? vscode.Uri.joinPath(folder.uri, '.vscode', 'launch.json')
      : undefined;
  }

  private _getTasksJsonUri(): vscode.Uri | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0];
    return folder
      ? vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json')
      : undefined;
  }

  /** Generate the HTML document for the webview. */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'main.css')
    );

    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${webview.cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      font-src ${webview.cspSource};
      img-src ${webview.cspSource} data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>LaunchPad</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
