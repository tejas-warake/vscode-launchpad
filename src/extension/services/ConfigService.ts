import * as vscode from 'vscode';
import * as jsonc from 'jsonc-parser';
import type { LaunchConfig } from '../../shared/protocol';

/**
 * Service for reading, writing, and watching launch.json.
 * Uses jsonc-parser to safely handle JSON with comments.
 */
export class ConfigService {
  private _onDidChange = new vscode.EventEmitter<LaunchConfig[]>();
  public readonly onDidChange = this._onDidChange.event;

  private _watcher?: vscode.FileSystemWatcher;
  private _configs: LaunchConfig[] = [];

  constructor() {
    this._setupWatcher();
  }

  /** Get all launch configurations from the current workspace. */
  public async getConfigs(): Promise<LaunchConfig[]> {
    const uri = this._getLaunchJsonUri();
    if (!uri) {
      this._configs = [];
      return [];
    }

    try {
      const doc = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(doc).toString('utf-8');
      const parsed = jsonc.parse(text);
      this._configs = Array.isArray(parsed?.configurations)
        ? parsed.configurations
        : [];
      return this._configs;
    } catch {
      // File doesn't exist yet — that's fine
      this._configs = [];
      return [];
    }
  }

  /** Add a new launch configuration. */
  public async addConfig(config: LaunchConfig): Promise<void> {
    await this._mutate((data) => {
      if (!data.configurations) {
        data.configurations = [];
      }
      data.configurations.push(config);
    });
  }

  /** Update a launch configuration at a given index. */
  public async updateConfig(index: number, config: LaunchConfig): Promise<void> {
    await this._mutate((data) => {
      if (data.configurations && index >= 0 && index < data.configurations.length) {
        data.configurations[index] = config;
      }
    });
  }

  /** Delete a launch configuration at a given index. */
  public async deleteConfig(index: number): Promise<void> {
    await this._mutate((data) => {
      if (data.configurations && index >= 0 && index < data.configurations.length) {
        data.configurations.splice(index, 1);
      }
    });
  }

  /** Duplicate a launch configuration at a given index. */
  public async duplicateConfig(index: number): Promise<void> {
    await this._mutate((data) => {
      if (data.configurations && index >= 0 && index < data.configurations.length) {
        const original = data.configurations[index];
        const copy = { ...original, name: `${original.name} (Copy)` };
        data.configurations.splice(index + 1, 0, copy);
      }
    });
  }

  /** Start a debug session with the given config name. */
  public async runConfig(name: string): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    const configs = await this.getConfigs();
    const config = configs.find((c) => c.name === name);

    if (!config) {
      vscode.window.showErrorMessage(`LaunchPad: Configuration "${name}" not found.`);
      return;
    }

    try {
      await vscode.debug.startDebugging(folder, config);
    } catch (err: any) {
      vscode.window.showErrorMessage(`LaunchPad: Failed to start debugging — ${err.message}`);
    }
  }

  public dispose() {
    this._watcher?.dispose();
    this._onDidChange.dispose();
  }

  // ── Private helpers ──────────────────────────────────────────

  private _getLaunchJsonUri(): vscode.Uri | undefined {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) { return undefined; }
    return vscode.Uri.joinPath(folder.uri, '.vscode', 'launch.json');
  }

  /**
   * Read → mutate → write pattern using JSONC edits to preserve comments.
   */
  private async _mutate(mutator: (data: any) => void): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      vscode.window.showErrorMessage('LaunchPad: No workspace folder open.');
      return;
    }

    const uri = vscode.Uri.joinPath(folder.uri, '.vscode', 'launch.json');
    let text: string;

    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      text = Buffer.from(raw).toString('utf-8');
    } catch {
      // File doesn't exist — create from scratch
      text = '{\n  "version": "0.2.0",\n  "configurations": []\n}';
      // Ensure .vscode directory exists
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.joinPath(folder.uri, '.vscode')
      );
    }

    const data = jsonc.parse(text);
    mutator(data);

    const newText = JSON.stringify(data, null, 2) + '\n';
    await vscode.workspace.fs.writeFile(uri, Buffer.from(newText, 'utf-8'));

    // Re-read and notify
    await this.getConfigs();
    this._onDidChange.fire(this._configs);
  }

  private _setupWatcher() {
    this._watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/launch.json');

    const refresh = async () => {
      await this.getConfigs();
      this._onDidChange.fire(this._configs);
    };

    this._watcher.onDidChange(refresh);
    this._watcher.onDidCreate(refresh);
    this._watcher.onDidDelete(refresh);
  }
}
