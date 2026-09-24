import * as vscode from 'vscode';
import type {
  EditorToExtensionMessage,
  EditorToWebviewMessage,
  EditorFilePickResult,
  LaunchConfig,
  TaskConfig,
} from '../../shared/protocol';
import { ConfigService } from '../services/ConfigService';
import { TaskService } from '../services/TaskService';

/**
 * Manages the editor webview panel (opens as a full tab).
 * Provides the form-based visual editor for configurations and tasks.
 */
export class EditorPanelManager {
  private _panel?: vscode.WebviewPanel;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _configService: ConfigService,
    private readonly _taskService: TaskService
  ) {}

  /** Open the editor to create a new config */
  public openNewConfig(template?: Partial<LaunchConfig>) {
    const config: LaunchConfig = {
      name: 'New Configuration',
      type: 'node',
      request: 'launch',
      ...template,
    };
    this._openPanel('new-config');
    this._sendToEditor({ type: 'loadConfig', config, index: -1, isNew: true });
  }

  /** Open the editor to edit an existing config */
  public async openEditConfig(index: number) {
    const configs = await this._configService.getConfigs();
    if (index < 0 || index >= configs.length) { return; }
    this._openPanel(`edit-config-${index}`);
    this._sendToEditor({
      type: 'loadConfig',
      config: configs[index],
      index,
      isNew: false,
    });
  }

  /** Open the editor to create a new task */
  public openNewTask(template?: Partial<TaskConfig>) {
    const task: TaskConfig = {
      label: 'New Task',
      type: 'shell',
      command: '',
      ...template,
    };
    this._openPanel('new-task');
    this._sendToEditor({ type: 'loadTask', task, index: -1, isNew: true });
  }

  /** Open the editor to edit an existing task */
  public async openEditTask(index: number) {
    const tasks = await this._taskService.getTasks();
    if (index < 0 || index >= tasks.length) { return; }
    this._openPanel(`edit-task-${index}`);
    this._sendToEditor({
      type: 'loadTask',
      task: tasks[index],
      index,
      isNew: false,
    });
  }

  private _openPanel(contextId: string) {
    if (this._panel) {
      this._panel.reveal();
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      'launchpad.editor',
      '🚀 LaunchPad Editor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this._extensionUri],
      }
    );

    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    this._panel.webview.onDidReceiveMessage(
      (message: EditorToExtensionMessage) => this._handleMessage(message)
    );

    this._panel.onDidDispose(() => {
      this._panel = undefined;
    });
  }

  private _sendToEditor(message: EditorToWebviewMessage | EditorFilePickResult) {
    // Small delay to ensure the webview is ready
    setTimeout(() => {
      this._panel?.webview.postMessage(message);
    }, 100);
  }

  private async _handleMessage(message: EditorToExtensionMessage) {
    switch (message.type) {
      case 'ready':
        // Panel just loaded — data will be sent after open
        break;

      case 'saveConfig': {
        if (message.isNew) {
          await this._configService.addConfig(message.config);
          vscode.window.showInformationMessage(
            `LaunchPad: Configuration "${message.config.name}" created!`
          );
        } else {
          await this._configService.updateConfig(message.index, message.config);
          vscode.window.showInformationMessage(
            `LaunchPad: Configuration "${message.config.name}" updated!`
          );
        }
        this._panel?.dispose();
        break;
      }

      case 'saveTask': {
        if (message.isNew) {
          await this._taskService.addTask(message.task);
          vscode.window.showInformationMessage(
            `LaunchPad: Task "${message.task.label}" created!`
          );
        } else {
          await this._taskService.updateTask(message.index, message.task);
          vscode.window.showInformationMessage(
            `LaunchPad: Task "${message.task.label}" updated!`
          );
        }
        this._panel?.dispose();
        break;
      }

      case 'runConfig':
        await this._configService.runConfig(message.name);
        break;

      case 'cancel':
        this._panel?.dispose();
        break;

      case 'pickFile': {
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: 'Select File',
        });
        if (uris && uris[0]) {
          const folder = vscode.workspace.workspaceFolders?.[0];
          const relativePath = folder
            ? '${workspaceFolder}/' +
              vscode.workspace.asRelativePath(uris[0], false)
            : uris[0].fsPath;
          this._sendToEditor({
            type: 'filePickResult',
            field: message.field,
            path: relativePath,
          });
        }
        break;
      }

      case 'pickFolder': {
        const uris = await vscode.window.showOpenDialog({
          canSelectMany: false,
          canSelectFolders: true,
          canSelectFiles: false,
          openLabel: 'Select Folder',
        });
        if (uris && uris[0]) {
          const folder = vscode.workspace.workspaceFolders?.[0];
          const relativePath = folder
            ? '${workspaceFolder}/' +
              vscode.workspace.asRelativePath(uris[0], false)
            : uris[0].fsPath;
          this._sendToEditor({
            type: 'filePickResult',
            field: message.field,
            path: relativePath,
          });
        }
        break;
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview-editor', 'editor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview-editor', 'editor.css')
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
  <title>LaunchPad Editor</title>
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
