import * as vscode from 'vscode';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../../shared/protocol';

/**
 * Provides the sidebar webview for the Debug panel.
 * Handles HTML generation, CSP, and bidirectional message passing.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

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

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message: WebviewToExtensionMessage) => {
        this._handleMessage(message);
      }
    );
  }

  /**
   * Send a typed message to the webview.
   */
  public postMessage(message: ExtensionToWebviewMessage) {
    this._view?.webview.postMessage(message);
  }

  private _handleMessage(message: WebviewToExtensionMessage) {
    switch (message.type) {
      case 'ready':
        // Webview is loaded — send initial data
        // (will be wired to ConfigService in next feature)
        this.postMessage({ type: 'init', configs: [], tasks: [] });
        break;

      case 'createConfig':
        vscode.window.showInformationMessage(
          'LaunchPad: Config creation coming soon!'
        );
        break;

      case 'createTask':
        vscode.window.showInformationMessage(
          'LaunchPad: Task creation coming soon!'
        );
        break;

      default:
        console.log('[LaunchPad] Unhandled webview message:', message);
    }
  }

  /**
   * Generate the HTML document for the webview.
   * References the esbuild-bundled webview JS and CSS.
   */
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

/** Generate a random nonce for Content Security Policy. */
function getNonce(): string {
  let text = '';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
