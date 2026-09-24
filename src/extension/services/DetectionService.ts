import * as vscode from 'vscode';
import type { LaunchConfig } from '../../shared/protocol';
import { DEBUG_TYPES } from '../../shared/templates';

/**
 * Heuristics-based project auto-detection to suggest the best launch configurations.
 */
export class DetectionService {
  /**
   * Scan the workspace and return a list of recommended configurations.
   */
  public static async detectConfigs(): Promise<Partial<LaunchConfig>[]> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return [];
    }

    const rootUri = folders[0].uri;
    const recommended: Partial<LaunchConfig>[] = [];

    // Check for Node.js (package.json)
    try {
      const pkgUri = vscode.Uri.joinPath(rootUri, 'package.json');
      const stat = await vscode.workspace.fs.stat(pkgUri);
      if (stat.type === vscode.FileType.File) {
        // Read package.json to see what scripts exist
        const content = await vscode.workspace.fs.readFile(pkgUri);
        const pkg = JSON.parse(new TextDecoder().decode(content));

        const nodeType = DEBUG_TYPES.find((d) => d.type === 'node');
        if (nodeType) {
          // Add default node launch
          const defaultNode = nodeType.templates.find(t => t.name.includes('Launch Program'));
          if (defaultNode) {
            recommended.push({ ...defaultNode.config, name: 'Auto: Node.js' });
          }

          // Check if it's a Jest project
          if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
            const jestTpl = nodeType.templates.find(t => t.name.includes('Jest'));
            if (jestTpl) {
              recommended.push({ ...jestTpl.config, name: 'Auto: Jest Tests' });
            }
          }
        }
      }
    } catch {
      // package.json not found
    }

    // Check for Python (requirements.txt, Pipfile, or manage.py)
    try {
      const manageUri = vscode.Uri.joinPath(rootUri, 'manage.py');
      const stat = await vscode.workspace.fs.stat(manageUri);
      if (stat.type === vscode.FileType.File) {
        const pyType = DEBUG_TYPES.find((d) => d.type === 'python');
        const django = pyType?.templates.find((t) => t.name.includes('Django'));
        if (django) {
          recommended.push({ ...django.config, name: 'Auto: Django' });
        }
      }
    } catch {
      // Not a Django project
    }

    // Generic Python file check
    const pyFiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**', 1);
    if (pyFiles.length > 0) {
      const pyType = DEBUG_TYPES.find((d) => d.type === 'python');
      const pyFile = pyType?.templates.find((t) => t.name.includes('Python File'));
      if (pyFile) {
        recommended.push({ ...pyFile.config, name: 'Auto: Python File' });
      }
    }

    // Check for Go
    try {
      const modUri = vscode.Uri.joinPath(rootUri, 'go.mod');
      const stat = await vscode.workspace.fs.stat(modUri);
      if (stat.type === vscode.FileType.File) {
        const goType = DEBUG_TYPES.find((d) => d.type === 'go');
        const goLaunch = goType?.templates.find((t) => t.name.includes('Package'));
        if (goLaunch) {
          recommended.push({ ...goLaunch.config, name: 'Auto: Go Package' });
        }
      }
    } catch {
      // Not a Go module
    }

    // Check for Rust
    try {
      const cargoUri = vscode.Uri.joinPath(rootUri, 'Cargo.toml');
      const stat = await vscode.workspace.fs.stat(cargoUri);
      if (stat.type === vscode.FileType.File) {
        // Just add an LLDB template
        const cppType = DEBUG_TYPES.find((d) => d.type === 'cppdbg');
        const lldb = cppType?.templates.find((t) => t.name.includes('LLDB'));
        if (lldb) {
          recommended.push({
            ...lldb.config,
            name: 'Auto: Rust (LLDB)',
            program: '${workspaceFolder}/target/debug/${workspaceFolderBasename}'
          });
        }
      }
    } catch {
      // Not a Rust project
    }

    // Ensure uniqueness by name
    const unique = new Map<string, Partial<LaunchConfig>>();
    for (const c of recommended) {
      unique.set(c.name!, c);
    }

    return Array.from(unique.values());
  }
}
