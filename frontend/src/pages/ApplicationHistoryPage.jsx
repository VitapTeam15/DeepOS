import React, { useState, useEffect } from 'react';
import { getApplicationHistory } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  Layers, 
  Workflow, 
  Clock, 
  ArrowRight, 
  Code2, 
  Globe, 
  Music, 
  Terminal, 
  Folder, 
  FileText, 
  AppWindow,
  RefreshCw
} from 'lucide-react';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import EmptyState from '../components/Common/EmptyState';

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

export default function ApplicationHistoryPage() {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getApplicationHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch app history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Recently';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const chartData = (history?.most_used || []).slice(0, 8).map(item => ({
    name: item.name.replace(/\.exe$/i, ''),
    launches: item.launch_count || 0
  }));

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Application Activity & Insights</h1>
          <p className="page-header-desc">
            Historical software usage telemetry and recurring workflow transitions
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchHistory} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={2} height="280px" />
      ) : !history ? (
        <EmptyState 
          icon={Layers}
          title="Telemetry Data Unavailable"
          description="Could not connect to the local history database. Ensure the Deep OS backend is running."
        />
      ) : (
        <>
          {/* Most Used Applications Bar Chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <div className="card-title-icon">
                  <Layers size={16} />
                </div>
                <div>
                  <h3>Most Frequently Launched Applications</h3>
                  <p>Aggregate launch frequency count from active telemetry</p>
                </div>
              </div>
            </div>

            <div className="card-body" style={{ height: '320px', width: '100%', marginTop: '0.5rem' }}>
              {chartData.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <p>Insufficient application launch events logged yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C8CFF" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 140, 255, 0.08)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#62718D" 
                      fontSize={11} 
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke="#62718D" 
                      fontSize={11} 
                      tickLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(108, 140, 255, 0.06)' }}
                      contentStyle={{ 
                        backgroundColor: '#0F1524', 
                        borderColor: 'rgba(108, 140, 255, 0.25)', 
                        borderRadius: '8px',
                        color: '#F3F6FC',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }} 
                    />
                    <Bar dataKey="launches" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sequences and Recent Activity Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Common App Sequences */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Workflow size={16} />
                  </div>
                  <div>
                    <h3>Recurring Workflows</h3>
                    <p>Sequential application transitions</p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {history.sequences && history.sequences.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {history.sequences.map((seq, i) => (
                      <div 
                        key={i} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {seq.from_app.replace(/\.exe$/i, '')}
                          </span>
                          <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-highlight)' }}>
                            {seq.to_app.replace(/\.exe$/i, '')}
                          </span>
                        </div>
                        <span className="badge badge-muted">
                          {seq.count} {seq.count === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.86rem' }}>Collecting sequence data. Patterns will appear as you switch between apps.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h3>Recent Software Events</h3>
                    <p>Live event log from process tracker</p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {history.recent && history.recent.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {history.recent.slice(0, 7).map((act, i) => {
                      const Icon = getAppIcon(act.name);
                      const cleanName = act.name.replace(/\.exe$/i, '');
                      return (
                        <div 
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 'var(--radius-xs)',
                              background: 'rgba(108, 140, 255, 0.1)',
                              color: 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={14} />
                            </div>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {cleanName}
                            </span>
                          </div>

                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {formatLastSeen(act.last_seen)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '0.86rem' }}>No recent events recorded in this database snapshot.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}