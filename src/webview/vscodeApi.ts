import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../shared/protocol';

/**
 * Type-safe wrapper around the VS Code webview API.
 * acquireVsCodeApi() is a global provided by VS Code in the webview context.
 */
interface VSCodeWebviewApi {
  postMessage(message: WebviewToExtensionMessage): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeWebviewApi;

// Acquire once — VS Code throws if called more than once
export const vscode = acquireVsCodeApi();

/**
 * Subscribe to messages from the extension host.
 * Returns an unsubscribe function.
 */
export function onMessage(
  handler: (message: ExtensionToWebviewMessage) => void
): () => void {
  const listener = (event: MessageEvent<ExtensionToWebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
