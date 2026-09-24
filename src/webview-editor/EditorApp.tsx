import { useState, useEffect, useCallback } from 'react';
import { vscode, onMessage } from './editorVscodeApi';
import type { LaunchConfig, TaskConfig } from '../shared/protocol';
import { DEBUG_TYPES } from '../shared/templates';

type EditorMode = 'loading' | 'config' | 'task';

export function EditorApp() {
  const [mode, setMode] = useState<EditorMode>('loading');
  const [config, setConfig] = useState<LaunchConfig | null>(null);
  const [task, setTask] = useState<TaskConfig | null>(null);
  const [index, setIndex] = useState(-1);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      switch (message.type) {
        case 'loadConfig':
          setConfig({ ...message.config });
          setIndex(message.index);
          setIsNew(message.isNew);
          setMode('config');
          break;
        case 'loadTask':
          setTask({ ...message.task });
          setIndex(message.index);
          setIsNew(message.isNew);
          setMode('task');
          break;
        case 'filePickResult':
          // Update the appropriate field
          setConfig((prev) => prev ? { ...prev, [message.field]: message.path } : prev);
          setTask((prev) => prev ? { ...prev, [message.field]: message.path } : prev);
          break;
      }
    });

    vscode.postMessage({ type: 'ready' });
    return unsubscribe;
  }, []);

  if (mode === 'loading') {
    return (
      <div className="ed-loading">
        <div className="ed-loading-spinner" />
        <p>Loading editor...</p>
      </div>
    );
  }

  if (mode === 'config' && config) {
    return (
      <ConfigEditor
        config={config}
        setConfig={setConfig}
        index={index}
        isNew={isNew}
      />
    );
  }

  if (mode === 'task' && task) {
    return (
      <TaskEditor
        task={task}
        setTask={setTask}
        index={index}
        isNew={isNew}
      />
    );
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   CONFIG EDITOR
   ═══════════════════════════════════════════════════════════════ */

function ConfigEditor({
  config,
  setConfig,
  index,
  isNew,
}: {
  config: LaunchConfig;
  setConfig: React.Dispatch<React.SetStateAction<LaunchConfig | null>>;
  index: number;
  isNew: boolean;
}) {
  const update = useCallback(
    (field: string, value: any) => {
      setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [setConfig]
  );

  const handleSave = () => {
    if (!config) { return; }
    vscode.postMessage({ type: 'saveConfig', config, index, isNew });
  };

  const handleRun = () => {
    if (!config) { return; }
    vscode.postMessage({ type: 'runConfig', name: config.name });
  };

  const handleCancel = () => {
    vscode.postMessage({ type: 'cancel' });
  };

  const handlePickFile = (field: string) => {
    vscode.postMessage({ type: 'pickFile', field });
  };

  const jsonPreview = JSON.stringify(config, null, 2);

  // Env variables as array of [key, value] pairs
  const envEntries: [string, string][] = config.env
    ? Object.entries(config.env)
    : [];

  const updateEnv = (entries: [string, string][]) => {
    const env: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (k.trim()) { env[k] = v; }
    }
    update('env', Object.keys(env).length > 0 ? env : undefined);
  };

  // Args as array
  const args: string[] = Array.isArray(config.args) ? config.args : [];

  const updateArgs = (newArgs: string[]) => {
    update('args', newArgs.length > 0 ? newArgs : undefined);
  };

  return (
    <div className="ed-container">
      {/* ── Header ─────────────────────────────────── */}
      <header className="ed-header">
        <div className="ed-header-left">
          <span className="ed-header-icon">🚀</span>
          <div>
            <h1 className="ed-header-title">
              {isNew ? 'New Configuration' : 'Edit Configuration'}
            </h1>
            <span className="ed-header-subtitle">{config.name}</span>
          </div>
        </div>
        <div className="ed-header-actions">
          <button className="ed-btn ed-btn--ghost" onClick={handleCancel}>
            Cancel
          </button>
          {!isNew && (
            <button className="ed-btn ed-btn--secondary" onClick={handleRun}>
              ▶ Run
            </button>
          )}
          <button className="ed-btn ed-btn--primary" onClick={handleSave}>
            💾 {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── Split Pane ─────────────────────────────── */}
      <div className="ed-split">
        {/* ── Form ──────────────────────────────────── */}
        <div className="ed-form-pane">
          <div className="ed-form">
            {/* Basic Fields */}
            <FieldGroup title="Basic">
              <TextField
                label="Name"
                value={config.name}
                onChange={(v) => update('name', v)}
                placeholder="My Debug Config"
                required
              />
              <SelectField
                label="Type"
                value={config.type}
                onChange={(v) => update('type', v)}
                options={DEBUG_TYPES.map((d) => ({
                  value: d.type,
                  label: `${d.icon} ${d.label}`,
                }))}
              />
              <RadioField
                label="Request"
                value={config.request}
                onChange={(v) => update('request', v)}
                options={[
                  { value: 'launch', label: '▶ Launch' },
                  { value: 'attach', label: '🔗 Attach' },
                ]}
              />
            </FieldGroup>

            {/* Program & Paths */}
            <FieldGroup title="Program">
              <FilePickerField
                label="Program"
                value={config.program ?? ''}
                onChange={(v) => update('program', v)}
                onPick={() => handlePickFile('program')}
                placeholder="${workspaceFolder}/index.js"
              />
              <FilePickerField
                label="Working Directory"
                value={config.cwd ?? ''}
                onChange={(v) => update('cwd', v || undefined)}
                onPick={() => vscode.postMessage({ type: 'pickFolder', field: 'cwd' })}
                placeholder="${workspaceFolder}"
                isFolder
              />
              <SelectField
                label="Console"
                value={config.console ?? 'internalConsole'}
                onChange={(v) => update('console', v)}
                options={[
                  { value: 'internalConsole', label: 'Internal Console' },
                  { value: 'integratedTerminal', label: 'Integrated Terminal' },
                  { value: 'externalTerminal', label: 'External Terminal' },
                ]}
              />
            </FieldGroup>

            {/* Arguments */}
            <FieldGroup title="Arguments">
              <TagInput
                label="Args"
                tags={args}
                onChange={updateArgs}
                placeholder="Add argument..."
              />
            </FieldGroup>

            {/* Environment Variables */}
            <FieldGroup title="Environment Variables">
              <KeyValueEditor
                entries={envEntries}
                onChange={updateEnv}
              />
            </FieldGroup>

            {/* Options */}
            <FieldGroup title="Options">
              <ToggleField
                label="Source Maps"
                checked={config.sourceMaps ?? false}
                onChange={(v) => update('sourceMaps', v || undefined)}
              />
              <ToggleField
                label="Stop On Entry"
                checked={config.stopOnEntry ?? false}
                onChange={(v) => update('stopOnEntry', v || undefined)}
              />
              <TextField
                label="Pre-Launch Task"
                value={config.preLaunchTask ?? ''}
                onChange={(v) => update('preLaunchTask', v || undefined)}
                placeholder="npm: build"
              />
              <TextField
                label="Post-Debug Task"
                value={config.postDebugTask ?? ''}
                onChange={(v) => update('postDebugTask', v || undefined)}
                placeholder=""
              />
            </FieldGroup>

            {/* Port (for attach) */}
            {config.request === 'attach' && (
              <FieldGroup title="Connection">
                <TextField
                  label="Port"
                  value={String(config.port ?? '')}
                  onChange={(v) => update('port', v ? parseInt(v, 10) || 0 : undefined)}
                  placeholder="9229"
                  type="number"
                />
                <TextField
                  label="Address"
                  value={config.address ?? ''}
                  onChange={(v) => update('address', v || undefined)}
                  placeholder="localhost"
                />
              </FieldGroup>
            )}
          </div>
        </div>

        {/* ── JSON Preview ──────────────────────────── */}
        <div className="ed-preview-pane">
          <div className="ed-preview-header">
            <span className="ed-preview-title">📄 JSON Preview</span>
            <button
              className="ed-btn ed-btn--ghost ed-btn--sm"
              onClick={() => navigator.clipboard.writeText(jsonPreview)}
            >
              📋 Copy
            </button>
          </div>
          <pre className="ed-preview-code">
            <code>{jsonPreview}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK EDITOR
   ═══════════════════════════════════════════════════════════════ */

function TaskEditor({
  task,
  setTask,
  index,
  isNew,
}: {
  task: TaskConfig;
  setTask: React.Dispatch<React.SetStateAction<TaskConfig | null>>;
  index: number;
  isNew: boolean;
}) {
  const update = useCallback(
    (field: string, value: any) => {
      setTask((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [setTask]
  );

  const handleSave = () => {
    if (!task) { return; }
    vscode.postMessage({ type: 'saveTask', task, index, isNew });
  };

  const handleCancel = () => {
    vscode.postMessage({ type: 'cancel' });
  };

  const jsonPreview = JSON.stringify(task, null, 2);

  // Group handling
  const groupKind = typeof task.group === 'string'
    ? task.group
    : task.group?.kind ?? '';
  const groupIsDefault = typeof task.group === 'object' ? task.group?.isDefault ?? false : false;

  const updateGroup = (kind: string, isDefault: boolean) => {
    if (!kind) {
      const { group, ...rest } = task;
      setTask(rest as TaskConfig);
    } else if (isDefault) {
      update('group', { kind, isDefault: true });
    } else {
      update('group', kind);
    }
  };

  // Args as array
  const args: string[] = Array.isArray(task.args) ? task.args : [];

  return (
    <div className="ed-container">
      <header className="ed-header">
        <div className="ed-header-left">
          <span className="ed-header-icon">📋</span>
          <div>
            <h1 className="ed-header-title">
              {isNew ? 'New Task' : 'Edit Task'}
            </h1>
            <span className="ed-header-subtitle">{task.label}</span>
          </div>
        </div>
        <div className="ed-header-actions">
          <button className="ed-btn ed-btn--ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button className="ed-btn ed-btn--primary" onClick={handleSave}>
            💾 {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </header>

      <div className="ed-split">
        <div className="ed-form-pane">
          <div className="ed-form">
            <FieldGroup title="Basic">
              <TextField
                label="Label"
                value={task.label}
                onChange={(v) => update('label', v)}
                placeholder="My Task"
                required
              />
              <SelectField
                label="Type"
                value={task.type}
                onChange={(v) => update('type', v)}
                options={[
                  { value: 'shell', label: '🐚 Shell' },
                  { value: 'process', label: '⚙️ Process' },
                  { value: 'npm', label: '📦 NPM' },
                ]}
              />
              <TextField
                label="Command"
                value={task.command ?? ''}
                onChange={(v) => update('command', v || undefined)}
                placeholder="npm run build"
              />
            </FieldGroup>

            <FieldGroup title="Arguments">
              <TagInput
                label="Args"
                tags={args}
                onChange={(newArgs) =>
                  update('args', newArgs.length > 0 ? newArgs : undefined)
                }
                placeholder="Add argument..."
              />
            </FieldGroup>

            <FieldGroup title="Group">
              <SelectField
                label="Group Kind"
                value={groupKind}
                onChange={(v) => updateGroup(v, groupIsDefault)}
                options={[
                  { value: '', label: 'None' },
                  { value: 'build', label: '🔨 Build' },
                  { value: 'test', label: '🧪 Test' },
                ]}
              />
              {groupKind && (
                <ToggleField
                  label="Is Default"
                  checked={groupIsDefault}
                  onChange={(v) => updateGroup(groupKind, v)}
                />
              )}
            </FieldGroup>

            <FieldGroup title="Presentation">
              <SelectField
                label="Reveal"
                value={task.presentation?.reveal ?? 'always'}
                onChange={(v) =>
                  update('presentation', {
                    ...(task.presentation ?? {}),
                    reveal: v,
                  })
                }
                options={[
                  { value: 'always', label: 'Always' },
                  { value: 'silent', label: 'Silent' },
                  { value: 'never', label: 'Never' },
                ]}
              />
              <ToggleField
                label="Echo Command"
                checked={task.presentation?.echo ?? true}
                onChange={(v) =>
                  update('presentation', {
                    ...(task.presentation ?? {}),
                    echo: v,
                  })
                }
              />
              <ToggleField
                label="Focus Terminal"
                checked={task.presentation?.focus ?? false}
                onChange={(v) =>
                  update('presentation', {
                    ...(task.presentation ?? {}),
                    focus: v,
                  })
                }
              />
            </FieldGroup>

            <FieldGroup title="Advanced">
              <TextField
                label="Problem Matcher"
                value={
                  Array.isArray(task.problemMatcher)
                    ? task.problemMatcher.join(', ')
                    : task.problemMatcher ?? ''
                }
                onChange={(v) =>
                  update(
                    'problemMatcher',
                    v ? v.split(',').map((s: string) => s.trim()) : undefined
                  )
                }
                placeholder="$tsc, $eslint"
              />
              <TextField
                label="Depends On"
                value={
                  Array.isArray(task.dependsOn)
                    ? task.dependsOn.join(', ')
                    : task.dependsOn ?? ''
                }
                onChange={(v) =>
                  update(
                    'dependsOn',
                    v
                      ? v.split(',').map((s: string) => s.trim())
                      : undefined
                  )
                }
                placeholder="compile, lint"
              />
            </FieldGroup>
          </div>
        </div>

        <div className="ed-preview-pane">
          <div className="ed-preview-header">
            <span className="ed-preview-title">📄 JSON Preview</span>
            <button
              className="ed-btn ed-btn--ghost ed-btn--sm"
              onClick={() => navigator.clipboard.writeText(jsonPreview)}
            >
              📋 Copy
            </button>
          </div>
          <pre className="ed-preview-code">
            <code>{jsonPreview}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE FIELD COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="ed-fieldgroup">
      <legend className="ed-fieldgroup-title">{title}</legend>
      <div className="ed-fieldgroup-content">{children}</div>
    </fieldset>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">
        {label}
        {required && <span className="ed-field-required">*</span>}
      </label>
      <input
        className="ed-field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      <select
        className="ed-field-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      <div className="ed-radio-group">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`ed-radio ${value === opt.value ? 'ed-radio--active' : ''}`}
          >
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="ed-radio-input"
            />
            <span className="ed-radio-label">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="ed-field ed-field--toggle">
      <label className="ed-field-label">{label}</label>
      <button
        className={`ed-toggle ${checked ? 'ed-toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span className="ed-toggle-thumb" />
      </button>
    </div>
  );
}

function FilePickerField({
  label,
  value,
  onChange,
  onPick,
  placeholder,
  isFolder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick: () => void;
  placeholder?: string;
  isFolder?: boolean;
}) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      <div className="ed-filepicker">
        <input
          className="ed-field-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button className="ed-filepicker-btn" onClick={onPick} title={isFolder ? 'Browse folder' : 'Browse file'}>
          📁
        </button>
      </div>
    </div>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      <div className="ed-tags">
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} className="ed-tag">
            <code>{tag}</code>
            <button className="ed-tag-remove" onClick={() => removeTag(i)}>
              ×
            </button>
          </span>
        ))}
        <input
          className="ed-tags-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>
    </div>
  );
}

function KeyValueEditor({
  entries,
  onChange,
}: {
  entries: [string, string][];
  onChange: (entries: [string, string][]) => void;
}) {
  const updateEntry = (index: number, key: string, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = [key, value];
    onChange(newEntries);
  };

  const addEntry = () => {
    onChange([...entries, ['', '']]);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="ed-field">
      <div className="ed-kv-list">
        {entries.length > 0 && (
          <div className="ed-kv-header">
            <span>Key</span>
            <span>Value</span>
            <span />
          </div>
        )}
        {entries.map(([key, value], i) => (
          <div key={i} className="ed-kv-row">
            <input
              className="ed-field-input"
              placeholder="KEY"
              value={key}
              onChange={(e) => updateEntry(i, e.target.value, value)}
            />
            <input
              className="ed-field-input"
              placeholder="value"
              value={value}
              onChange={(e) => updateEntry(i, key, e.target.value)}
            />
            <button
              className="ed-kv-remove"
              onClick={() => removeEntry(i)}
              title="Remove"
            >
              🗑️
            </button>
          </div>
        ))}
        <button className="ed-btn ed-btn--ghost ed-btn--sm" onClick={addEntry}>
          + Add Variable
        </button>
      </div>
    </div>
  );
}
