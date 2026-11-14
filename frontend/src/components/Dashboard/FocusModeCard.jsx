import React from 'react';
import { Focus, Shield, Zap, Sparkles } from 'lucide-react';
import Toggle from '../Common/Toggle';

const LEVELS = [
  { value: 1, label: 'Light', desc: 'Mutes non-critical alerts' },
  { value: 2, label: 'Balanced', desc: 'Suppresses distracting alerts' },
  { value: 3, label: 'Strict', desc: 'Critical system warnings only' }
];

export default function FocusModeCard({ enabled, level = 1, onToggle, onLevelChange }) {
  return (
    <div className={`card focus-card ${enabled ? 'active' : ''}`}>
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-title-icon" style={{ 
            background: enabled ? 'rgba(124, 92, 255, 0.2)' : 'rgba(108, 140, 255, 0.1)',
            color: enabled ? 'var(--accent-secondary)' : 'var(--text-muted)'
          }}>
            <Focus size={16} />
          </div>
          <div>
            <h3>Focus Mode</h3>
            <p>Notification suppression & workflow optimization</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: enabled ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
            {enabled ? 'ENABLED' : 'OFF'}
          </span>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
      </div>

      <div className="card-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
            {LEVELS.map((item) => {
              const isSelected = level === item.value;
              return (
                <div
                  key={item.value}
                  onClick={() => onLevelChange(item.value)}
                  className={`focus-level-option ${isSelected ? 'selected' : ''}`}
                  style={{
                    opacity: enabled ? 1 : 0.65,
                    pointerEvents: enabled ? 'auto' : 'none'
                  }}
                >
                  <div className="focus-level-name">
                    <span>{item.label}</span>
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-secondary)' }} />}
                  </div>
                  <p className="focus-level-desc">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {enabled && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.65rem 0.85rem', 
              background: 'rgba(124, 92, 255, 0.08)', 
              border: '1px solid rgba(124, 92, 255, 0.2)', 
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <Zap size={14} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
              <span>Deep OS is actively filtering desktop interruptions to preserve workflow flow state.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}