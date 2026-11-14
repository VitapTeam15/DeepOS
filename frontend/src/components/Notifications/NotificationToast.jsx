import React from 'react';
import { Zap, Sparkles, X, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function NotificationToast({ 
  title = "Deep OS", 
  message, 
  subtitle = "Suggested next step",
  type = 'info', 
  actionLabel = null,
  onAction = null,
  onClose 
}) {
  const getIcon = () => {
    if (type === 'success') return <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />;
    if (type === 'warning') return <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />;
    if (type === 'danger') return <AlertCircle size={18} style={{ color: 'var(--danger)' }} />;
    return <Sparkles size={18} style={{ color: 'var(--accent-highlight)' }} />;
  };

  return (
    <div className="modern-toast" style={{ minWidth: '320px', flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: 22, 
            height: 22, 
            borderRadius: 'var(--radius-xs)', 
            background: 'var(--accent-gradient)', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={12} fill="currentColor" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
        </div>

        <button 
          onClick={onClose} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-muted)', 
            cursor: 'pointer',
            padding: '2px',
            display: 'flex'
          }}
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
        {getIcon()}
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
            {subtitle}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
      </div>

      {(actionLabel || onClose) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
          >
            Dismiss
          </button>
          {actionLabel && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => {
                if (onAction) onAction();
                if (onClose) onClose();
              }}
            >
              <span>{actionLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}