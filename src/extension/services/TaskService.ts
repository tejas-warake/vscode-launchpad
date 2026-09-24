import * as vscode from 'vscode';
import * as jsonc from 'jsonc-parser';
import type { TaskConfig } from '../../shared/protocol';

/**
 * Service for reading, writing, and watching tasks.json.
 * Uses jsonc-parser to safely handle JSON with comments.
 */
export class TaskService {
  private _onDidChange = new vscode.EventEmitter<TaskConfig[]>();
  public readonly onDidChange = this._onDidChange.event;

  private _watcher?: vscode.FileSystemWatcher;
  private _tasks: TaskConfig[] = [];

  constructor() {
    this._setupWatcher();
  }

  /** Get all tasks from the current workspace. */
  public async getTasks(): Promise<TaskConfig[]> {
    const uri = this._getTasksJsonUri();
    if (!uri) {
      this._tasks = [];
      return [];
    }

    try {
      const doc = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(doc).toString('utf-8');
      const parsed = jsonc.parse(text);
      this._tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      return this._tasks;
    } catch {
      this._tasks = [];
      return [];
    }
  }

  /** Add a new task. */
  public async addTask(task: TaskConfig): Promise<void> {
    await this._mutate((data) => {
      if (!data.tasks) {
        data.tasks = [];
      }
      data.tasks.push(task);
    });
  }

  /** Update a task at a given index. */
  public async updateTask(index: number, task: TaskConfig): Promise<void> {
    await this._mutate((data) => {
      if (data.tasks && index >= 0 && index < data.tasks.length) {
        data.tasks[index] = task;
      }
    });
  }

  /** Delete a task at a given index. */
  public async deleteTask(index: number): Promise<void> {
    await this._mutate((data) => {
      if (data.tasks && index >= 0 && index < data.tasks.length) {
        data.tasks.splice(index, 1);
      }
    });
  }

  /** Duplicate a task at a given index. */
  public async duplicateTask(index: number): Promise<void> {
    await this._mutate((data) => {
      if (data.tasks && index >= 0 && index < data.tasks.length) {
        const original = data.tasks[index];
        const copy = { ...original, label: `${original.label} (Copy)` };
        data.tasks.splice(index + 1, 0, copy);
      }
    });
  }

  /** Run a task by label. */
  public async runTask(label: string): Promise<void> {
    const tasks = await vscode.tasks.fetchTasks();
    const match = tasks.find((t) => t.name === label);

    if (match) {
      await vscode.tasks.executeTask(match);
    } else {
      vscode.window.showErrorMessage(`LaunchPad: Task "${label}" not found.`);
    }
  }

  public dispose() {
    this._watcher?.dispose();
    this._onDidChange.dispose();
  }

  // ── Private helpers ──────────────────────────────────────────

  private _getTasksJsonUri(): vscode.Uri | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) { return undefined; }
    return vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');
  }

  private async _mutate(mutator: (data: any) => void): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      vscode.window.showErrorMessage('LaunchPad: No workspace folder open.');
      return;
    }

    const uri = vscode.Uri.joinPath(folder.uri, '.vscode', 'tasks.json');
    let text: string;

    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      text = Buffer.from(raw).toString('utf-8');
    } catch {
      text = '{\n  "version": "2.0.0",\n  "tasks": []\n}';
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(folder.uri, '.vscode')
      );
    }

    const data = jsonc.parse(text);
    mutator(data);

    const newText = JSON.stringify(data, null, 2) + '\n';
    await vscode.workspace.fs.writeFile(uri, Buffer.from(newText, 'utf-8'));

    await this.getTasks();
    this._onDidChange.fire(this._tasks);
  }

  private _setupWatcher() {
    this._watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/tasks.json');

    const refresh = async () => {
      await this.getTasks();
      this._onDidChange.fire(this._tasks);
    };

    this._watcher.onDidChange(refresh);
    this._watcher.onDidCreate(refresh);
    this._watcher.onDidDelete(refresh);
  }
}
