import React from 'react';
import { Bell, Sparkles, Check, Trash2 } from 'lucide-react';

export default function NotificationCenter({ notifications = [], onClearAll, onDismissItem }) {
  return (
    <div className="card" style={{ maxWidth: '380px', width: '100%' }}>
      <div className="card-header" style={{ marginBottom: '0.75rem' }}>
        <div className="card-title-group">
          <div className="card-title-icon">
            <Bell size={16} />
          </div>
          <div>
            <h3>Notifications</h3>
            <p>Intelligence alerts & system updates</p>
          </div>
        </div>

        {notifications.length > 0 && onClearAll && (
          <button className="btn btn-ghost btn-sm" onClick={onClearAll} title="Clear all notifications">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="card-body">
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.85rem' }}>All caught up! No unread notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.map((n, i) => (
              <div 
                key={n.id || i}
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>{n.title || 'Deep OS'}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{n.time || 'Now'}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}