import type { LaunchConfig } from '../../shared/protocol';
import { vscode } from '../vscodeApi';

/** Language/debugger type → icon + color mapping */
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  node: { icon: '🟢', color: '#68a063', label: 'Node.js' },
  pwa_node: { icon: '🟢', color: '#68a063', label: 'Node.js' },
  'pwa-node': { icon: '🟢', color: '#68a063', label: 'Node.js' },
  python: { icon: '🐍', color: '#3776ab', label: 'Python' },
  debugpy: { icon: '🐍', color: '#3776ab', label: 'Python' },
  cppdbg: { icon: '⚙️', color: '#00599C', label: 'C/C++' },
  cppvsdbg: { icon: '⚙️', color: '#00599C', label: 'C/C++' },
  go: { icon: '🔵', color: '#00ADD8', label: 'Go' },
  java: { icon: '☕', color: '#ED8B00', label: 'Java' },
  coreclr: { icon: '🟣', color: '#512BD4', label: '.NET' },
  chrome: { icon: '🌐', color: '#4285F4', label: 'Chrome' },
  'pwa-chrome': { icon: '🌐', color: '#4285F4', label: 'Chrome' },
  firefox: { icon: '🦊', color: '#E66000', label: 'Firefox' },
  edge: { icon: '🌊', color: '#0078D7', label: 'Edge' },
  'pwa-msedge': { icon: '🌊', color: '#0078D7', label: 'Edge' },
  php: { icon: '🐘', color: '#777BB4', label: 'PHP' },
  ruby: { icon: '💎', color: '#CC342D', label: 'Ruby' },
  rust: { icon: '🦀', color: '#DEA584', label: 'Rust' },
  lldb: { icon: '🔧', color: '#a855f7', label: 'LLDB' },
  extensionHost: { icon: '🧩', color: '#007ACC', label: 'Extension' },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: '🔹', color: '#888', label: type };
}

interface ConfigCardProps {
  config: LaunchConfig;
  index: number;
}

export function ConfigCard({ config, index }: ConfigCardProps) {
  const meta = getTypeMeta(config.type);

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'runConfig', name: config.name });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'editConfig', index });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'duplicateConfig', index });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'deleteConfig', index });
  };

  return (
    <div className="lp-card" style={{ '--card-accent': meta.color } as React.CSSProperties}>
      <div className="lp-card-header">
        <span className="lp-card-icon">{meta.icon}</span>
        <div className="lp-card-info">
          <span className="lp-card-name">{config.name}</span>
          <div className="lp-card-meta">
            <span className="lp-card-badge" style={{ background: meta.color + '22', color: meta.color }}>
              {meta.label}
            </span>
            <span className="lp-card-type">
              {config.request === 'attach' ? '🔗 Attach' : '▶ Launch'}
            </span>
          </div>
        </div>
      </div>

      <div className="lp-card-actions">
        <button className="lp-card-action lp-card-action--run" onClick={handleRun} title="Run">
          ▶
        </button>
        <button className="lp-card-action" onClick={handleEdit} title="Edit">
          ✏️
        </button>
        <button className="lp-card-action" onClick={handleDuplicate} title="Duplicate">
          📋
        </button>
        <button className="lp-card-action lp-card-action--danger" onClick={handleDelete} title="Delete">
          🗑️
        </button>
      </div>
    </div>
  );
}
