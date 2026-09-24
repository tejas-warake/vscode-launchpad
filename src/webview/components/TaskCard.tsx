import type { TaskConfig } from '../../shared/protocol';
import { vscode } from '../vscodeApi';

/** Extract the group kind from the flexible group field. */
function getGroupKind(group: TaskConfig['group']): string | undefined {
  if (!group) { return undefined; }
  if (typeof group === 'string') { return group; }
  return group.kind;
}

/** Check if this task is the default for its group. */
function isDefault(group: TaskConfig['group']): boolean {
  if (!group || typeof group === 'string') { return false; }
  return group.isDefault === true;
}

const GROUP_META: Record<string, { icon: string; color: string }> = {
  build: { icon: '🔨', color: '#f59e0b' },
  test: { icon: '🧪', color: '#10b981' },
  clean: { icon: '🧹', color: '#8b5cf6' },
};

interface TaskCardProps {
  task: TaskConfig;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const groupKind = getGroupKind(task.group);
  const groupMeta = groupKind ? GROUP_META[groupKind] : undefined;
  const isDefaultTask = isDefault(task.group);

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'runTask', label: task.label });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'editTask', index });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'duplicateTask', index });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    vscode.postMessage({ type: 'deleteTask', index });
  };

  return (
    <div className="lp-card lp-card--task">
      <div className="lp-card-header">
        <span className="lp-card-icon">
          {groupMeta?.icon ?? '⚡'}
        </span>
        <div className="lp-card-info">
          <span className="lp-card-name">{task.label}</span>
          <div className="lp-card-meta">
            <span className="lp-card-badge lp-card-badge--type">
              {task.type}
            </span>
            {groupKind && (
              <span
                className="lp-card-badge"
                style={{
                  background: (groupMeta?.color ?? '#888') + '22',
                  color: groupMeta?.color ?? '#888',
                }}
              >
                {groupKind}
              </span>
            )}
            {isDefaultTask && (
              <span className="lp-card-badge lp-card-badge--default">
                ★ default
              </span>
            )}
          </div>
          {task.command && (
            <code className="lp-card-command">{task.command}</code>
          )}
        </div>
      </div>

      <div className="lp-card-actions">
        <button className="lp-card-action lp-card-action--run" onClick={handleRun} title="Run Task">
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
