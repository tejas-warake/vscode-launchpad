import { useState, useEffect } from 'react';
import { vscode, onMessage } from './vscodeApi';
import type { LaunchConfig, TaskConfig } from '../shared/protocol';

type Tab = 'configs' | 'tasks';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [configs, setConfigs] = useState<LaunchConfig[]>([]);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);

  useEffect(() => {
    // Listen for messages from the extension
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case 'init':
          setConfigs(message.configs);
          setTasks(message.tasks);
          break;
        case 'configsUpdated':
          setConfigs(message.configs);
          break;
        case 'tasksUpdated':
          setTasks(message.tasks);
          break;
      }
    });

    // Tell the extension we're ready
    vscode.postMessage({ type: 'ready' });

    return unsubscribe;
  }, []);

  const handleCreateConfig = () => {
    vscode.postMessage({ type: 'createConfig' });
  };

  const handleCreateTask = () => {
    vscode.postMessage({ type: 'createTask' });
  };

  return (
    <div className="launchpad">
      {/* ── Header ─────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-header-brand">
          <span className="lp-header-icon" aria-hidden="true">🚀</span>
          <h1 className="lp-header-title">LaunchPad</h1>
        </div>
        <span className="lp-header-subtitle">Debug Config Manager</span>
      </header>

      {/* ── Tab Bar ────────────────────────────────── */}
      <nav className="lp-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'configs'}
          className={`lp-tab ${activeTab === 'configs' ? 'lp-tab--active' : ''}`}
          onClick={() => setActiveTab('configs')}
        >
          <span className="lp-tab-icon">⚡</span>
          Configs
          {configs.length > 0 && (
            <span className="lp-tab-badge">{configs.length}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'tasks'}
          className={`lp-tab ${activeTab === 'tasks' ? 'lp-tab--active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="lp-tab-icon">📋</span>
          Tasks
          {tasks.length > 0 && (
            <span className="lp-tab-badge">{tasks.length}</span>
          )}
        </button>
      </nav>

      {/* ── Content ────────────────────────────────── */}
      <div className="lp-content">
        {activeTab === 'configs' ? (
          configs.length === 0 ? (
            <EmptyState
              type="configs"
              onCreate={handleCreateConfig}
            />
          ) : (
            <div className="lp-placeholder">
              {/* Config cards will be built in Feature 2 */}
              <p>{configs.length} configuration(s) loaded</p>
            </div>
          )
        ) : (
          tasks.length === 0 ? (
            <EmptyState
              type="tasks"
              onCreate={handleCreateTask}
            />
          ) : (
            <div className="lp-placeholder">
              {/* Task cards will be built in Feature 2 */}
              <p>{tasks.length} task(s) loaded</p>
            </div>
          )
        )}
      </div>

      {/* ── Footer Actions ─────────────────────────── */}
      <footer className="lp-footer">
        <button
          className="lp-footer-btn"
          onClick={handleCreateConfig}
          title="New Launch Configuration"
        >
          <span className="lp-footer-btn-icon">+</span>
          Config
        </button>
        <div className="lp-footer-divider" />
        <button
          className="lp-footer-btn"
          onClick={handleCreateTask}
          title="New Task"
        >
          <span className="lp-footer-btn-icon">+</span>
          Task
        </button>
      </footer>
    </div>
  );
}

/* ─── Empty State Component ─────────────────────────────────── */

function EmptyState({
  type,
  onCreate,
}: {
  type: 'configs' | 'tasks';
  onCreate: () => void;
}) {
  const isConfigs = type === 'configs';

  return (
    <div className="lp-empty">
      <div className="lp-empty-glow" />

      <div className="lp-empty-icon">
        {isConfigs ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        )}
      </div>

      <h2 className="lp-empty-title">
        {isConfigs ? 'No Debug Configurations' : 'No Tasks Configured'}
      </h2>

      <p className="lp-empty-desc">
        {isConfigs
          ? 'Create your first debug configuration with a beautiful visual editor. No more hand-editing JSON.'
          : 'Automate your build, test, and deploy workflows with visual task management.'}
      </p>

      <button className="lp-empty-cta" onClick={onCreate}>
        <span className="lp-empty-cta-icon">+</span>
        {isConfigs ? 'Create Configuration' : 'Create Task'}
      </button>

      <div className="lp-empty-hint">
        <span className="lp-empty-hint-icon">💡</span>
        {isConfigs
          ? 'Tip: LaunchPad auto-detects your project type and suggests configs.'
          : 'Tip: Tasks can be linked as pre-launch steps for debug configs.'}
      </div>
    </div>
  );
}
