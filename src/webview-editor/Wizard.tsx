import { useState } from 'react';
import type { LaunchConfig } from '../shared/protocol';
import { DEBUG_TYPES, ConfigTemplate, DebugTypeInfo } from '../shared/templates';
import { vscode } from './editorVscodeApi';

interface WizardProps {
  onComplete: (config: LaunchConfig) => void;
  onCancel: () => void;
}

export function Wizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<DebugTypeInfo | null>(null);

  const handleSelectType = (typeInfo: DebugTypeInfo) => {
    setSelectedType(typeInfo);
    setStep(2);
  };

  const handleSelectTemplate = (template: ConfigTemplate) => {
    onComplete(template.config as LaunchConfig);
  };

  return (
    <div className="ed-container">
      <header className="ed-header">
        <div className="ed-header-left">
          <span className="ed-header-icon">🧙‍♂️</span>
          <div>
            <h1 className="ed-header-title">Create Configuration</h1>
            <span className="ed-header-subtitle">
              {step === 1 ? 'Step 1: Choose Debugger Type' : `Step 2: Choose ${selectedType?.label} Template`}
            </span>
          </div>
        </div>
        <div className="ed-header-actions">
          {step === 2 && (
            <button className="ed-btn ed-btn--secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
          )}
          <button className="ed-btn ed-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </header>

      <div className="ed-wizard-content">
        {step === 1 && (
          <div className="ed-wizard-grid">
            {DEBUG_TYPES.map((typeInfo) => (
              <button
                key={typeInfo.type}
                className="ed-wizard-card"
                onClick={() => handleSelectType(typeInfo)}
                style={{ '--hover-color': typeInfo.color } as React.CSSProperties}
              >
                <div className="ed-wizard-card-icon">{typeInfo.icon}</div>
                <div className="ed-wizard-card-title">{typeInfo.label}</div>
                <div className="ed-wizard-card-desc">
                  {typeInfo.templates.length} templates available
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && selectedType && (
          <div className="ed-wizard-grid">
            {selectedType.templates.map((template, i) => (
              <button
                key={i}
                className="ed-wizard-card ed-wizard-card--template"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="ed-wizard-card-icon">{template.icon}</div>
                <div className="ed-wizard-card-title">{template.name}</div>
                <div className="ed-wizard-card-desc">{template.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
