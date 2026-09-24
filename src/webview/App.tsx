import { useState, useEffect, useMemo } from 'react';
import { vscode, onMessage } from './vscodeApi';
import { ConfigCard } from './components/ConfigCard';
import { TaskCard } from './components/TaskCard';
import type { LaunchConfig, TaskConfig } from '../shared/protocol';

type Tab = 'configs' | 'tasks';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [configs, setConfigs] = useState<LaunchConfig[]>([]);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
        case 'newConfig':
          setActiveTab('configs');
          break;
        case 'newTask':
          setActiveTab('tasks');
          break;
      }
    });

    vscode.postMessage({ type: 'ready' });
    return unsubscribe;
  }, []);

  // ── Filtered lists ──────────────────────────────────────────
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) { return configs; }
    const q = searchQuery.toLowerCase();
    return configs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.request.toLowerCase().includes(q)
    );
  }, [configs, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) { return tasks; }
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.command ?? '').toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const handleCreateConfig = () => {
    vscode.postMessage({ type: 'createConfig' });
  };

  const handleCreateTask = () => {
    vscode.postMessage({ type: 'createTask' });
  };

  const totalItems = activeTab === 'configs' ? configs.length : tasks.length;
  const filteredItems = activeTab === 'configs' ? filteredConfigs.length : filteredTasks.length;

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

      {/* ── Search Bar ─────────────────────────────── */}
      {totalItems > 0 && (
        <div className="lp-search">
          <span className="lp-search-icon">🔍</span>
          <input
            className="lp-search-input"
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="lp-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* ── Content ────────────────────────────────── */}
      <div className="lp-content">
        {activeTab === 'configs' ? (
          configs.length === 0 ? (
            <EmptyState type="configs" onCreate={handleCreateConfig} />
          ) : filteredConfigs.length === 0 ? (
            <NoResults query={searchQuery} />
          ) : (
            <div className="lp-card-list">
              {filteredConfigs.map((config, i) => (
                <ConfigCard key={`${config.name}-${i}`} config={config} index={i} />
              ))}
            </div>
          )
        ) : (
          tasks.length === 0 ? (
            <EmptyState type="tasks" onCreate={handleCreateTask} />
          ) : filteredTasks.length === 0 ? (
            <NoResults query={searchQuery} />
          ) : (
            <div className="lp-card-list">
              {filteredTasks.map((task, i) => (
                <TaskCard key={`${task.label}-${i}`} task={task} index={i} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Footer Actions ─────────────────────────── */}
      <footer className="lp-footer">
        <button className="lp-footer-btn" onClick={handleCreateConfig} title="New Launch Configuration">
          <span className="lp-footer-btn-icon">+</span>
          Config
        </button>
        <div className="lp-footer-divider" />
        <button className="lp-footer-btn" onClick={handleCreateTask} title="New Task">
          <span className="lp-footer-btn-icon">+</span>
          Task
        </button>
      </footer>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────── */

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

/* ─── No Search Results ─────────────────────────────────────── */

function NoResults({ query }: { query: string }) {
  return (
    <div className="lp-no-results">
      <span className="lp-no-results-icon">🔍</span>
      <p>No results for "<strong>{query}</strong>"</p>
    </div>
  );
}
