import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorApp } from './EditorApp';
import './editor-styles.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <EditorApp />
    </React.StrictMode>
  );
}
