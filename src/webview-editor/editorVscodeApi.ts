import type {
  EditorToWebviewMessage,
  EditorToExtensionMessage,
  EditorFilePickResult,
} from '../shared/protocol';

interface VSCodeWebviewApi {
  postMessage(message: EditorToExtensionMessage): void;
  getState(): any;
  setState(state: any): void;
}

declare function acquireVsCodeApi(): VSCodeWebviewApi;

export const vscode = acquireVsCodeApi();

type IncomingMessage = EditorToWebviewMessage | EditorFilePickResult;

export function onMessage(handler: (message: IncomingMessage) => void): () => void {
  const listener = (event: MessageEvent<IncomingMessage>) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
