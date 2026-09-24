/**
 * Typed message protocol between the Extension Host and Webview UI.
 * All communication goes through postMessage — these types ensure type safety on both sides.
 */

// ─── Launch Configuration ────────────────────────────────────────
export interface LaunchConfig {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  [key: string]: any;
}

// ─── Task Configuration ──────────────────────────────────────────
export interface TaskConfig {
  label: string;
  type: string;
  command?: string;
  group?: string | { kind: string; isDefault?: boolean };
  [key: string]: any;
}

// ─── Extension → Webview Messages ────────────────────────────────
export type ExtensionToWebviewMessage =
  | { type: 'init'; configs: LaunchConfig[]; tasks: TaskConfig[] }
  | { type: 'configsUpdated'; configs: LaunchConfig[] }
  | { type: 'tasksUpdated'; tasks: TaskConfig[] }
  | { type: 'newConfig' }
  | { type: 'newTask' }
  | { type: 'refresh' };

// ─── Webview → Extension Messages ────────────────────────────────
export type WebviewToExtensionMessage =
  | { type: 'ready' }
  | { type: 'createConfig' }
  | { type: 'createTask' }
  | { type: 'runConfig'; name: string }
  | { type: 'deleteConfig'; index: number }
  | { type: 'duplicateConfig'; index: number }
  | { type: 'editConfig'; index: number }
  | { type: 'runTask'; label: string }
  | { type: 'deleteTask'; index: number }
  | { type: 'duplicateTask'; index: number }
  | { type: 'editTask'; index: number };

// ─── Editor Panel Protocol ───────────────────────────────────────
export type EditorToWebviewMessage =
  | { type: 'loadConfig'; config: LaunchConfig; index: number; isNew: boolean }
  | { type: 'loadTask'; task: TaskConfig; index: number; isNew: boolean };

export type EditorToExtensionMessage =
  | { type: 'ready' }
  | { type: 'saveConfig'; config: LaunchConfig; index: number; isNew: boolean }
  | { type: 'saveTask'; task: TaskConfig; index: number; isNew: boolean }
  | { type: 'runConfig'; name: string }
  | { type: 'cancel' }
  | { type: 'pickFile'; field: string }
  | { type: 'pickFolder'; field: string };

// File picker response
export type EditorFilePickResult =
  | { type: 'filePickResult'; field: string; path: string };

// ─── Debug Type Templates ────────────────────────────────────────

export interface ConfigTemplate {
  name: string;
  description: string;
  icon: string;
  config: Partial<LaunchConfig>;
}

export interface DebugTypeInfo {
  type: string;
  label: string;
  icon: string;
  color: string;
  templates: ConfigTemplate[];
}
