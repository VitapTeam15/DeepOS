import React from 'react';
import { Clock, AppWindow, ExternalLink, Code2, Globe, Music, Terminal, Folder, FileText, CheckCircle2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const getAppIcon = (appName = '') => {
  const name = appName.toLowerCase();
  if (name.includes('code') || name.includes('studio') || name.includes('dev')) return Code2;
  if (name.includes('chrome') || name.includes('edge') || name.includes('firefox') || name.includes('browser')) return Globe;
  if (name.includes('spotify') || name.includes('music')) return Music;
  if (name.includes('terminal') || name.includes('powershell') || name.includes('cmd') || name.includes('bash')) return Terminal;
  if (name.includes('explorer') || name.includes('files')) return Folder;
  if (name.includes('note') || name.includes('word') || name.includes('document')) return FileText;
  return AppWindow;
};

export default function RecentActivityCard({ recentApps = [], limit = 5 }) {
  const items = recentApps.slice(0, limit);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Recently active';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Today';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-title-icon">
            <Clock size={16} />
          </div>
          <div>
            <h3>Application Activity</h3>
            <p>Recent software usage and session duration</p>
          </div>
        </div>
        <NavLink to="/applications" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>View all</span>
          <ExternalLink size={13} />
        </NavLink>
      </div>

      <div className="card-body">
        {items.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.86rem' }}>No recent application events logged yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {items.map((app, index) => {
              const Icon = getAppIcon(app.name);
              const cleanName = (app.name || 'Application').replace(/\.exe$/i, '');
              const friendlyName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
              const durationText = app.duration_seconds 
                ? `${Math.max(1, Math.round(app.duration_seconds / 60))} min` 
                : (app.launch_count ? `${app.launch_count} launches` : 'Active');

              return (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(108, 140, 255, 0.1)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {friendlyName}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatLastSeen(app.last_seen || app.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ 
                      fontSize: '0.78rem', 
                      fontWeight: 600, 
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-tertiary)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {durationText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
