import React, { useState } from 'react';
import { terminateProcess } from '../../services/api';
import { AlertTriangle, X, Loader2, ShieldAlert } from 'lucide-react';

const TerminateDialog = ({ process, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!process) return null;

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);
    try {
      await terminateProcess(process.pid);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to terminate process');
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close-btn" onClick={onClose} disabled={loading} title="Close">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--danger-bg)', 
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid var(--danger-border)'
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Terminate Process
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>
              Irreversible System Action
            </span>
          </div>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          <p>
            Are you sure you want to forcibly terminate <strong style={{ color: 'var(--text-primary)' }}>{process.name}</strong>?
          </p>
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.65rem 0.85rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontFamily: 'monospace'
          }}>
            <div>PID: <span style={{ color: 'var(--accent-highlight)' }}>{process.pid}</span></div>
            <div>CPU: <span style={{ color: 'var(--text-primary)' }}>{process.cpu_percent?.toFixed(1)}%</span></div>
            <div>Memory: <span style={{ color: 'var(--text-primary)' }}>{process.memory_percent?.toFixed(1)}% ({process.memory_mb?.toFixed(0)} MB)</span></div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleTerminate} disabled={loading}>
            {loading ? (
              <><Loader2 size={15} className="spin" /> Terminating…</>
            ) : (
              'Confirm Terminate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminateDialog;