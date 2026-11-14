import React, { useState, useEffect } from 'react';
import { Terminal, ChevronDown, ChevronUp, Database, Cpu, Wifi, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { getDatabaseStatus, getSystemStatus } from '../../services/api';

export default function DeveloperInfoCard({ prediction, connected, metrics }) {
  const [expanded, setExpanded] = useState(false);
  const [dbStatus, setDbStatus] = useState(null);
  const [sysStatus, setSysStatus] = useState(null);

  useEffect(() => {
    if (expanded) {
      getDatabaseStatus().then(setDbStatus).catch(() => {});
      getSystemStatus().then(setSysStatus).catch(() => {});
    }
  }, [expanded]);

  const rawConfidence = prediction?.confidence !== undefined ? `${(prediction.confidence * 100).toFixed(2)}%` : 'N/A';
  const predictedTarget = prediction?.predicted_app || 'None';
  const resolvedExecutable = prediction?.executable || 'Auto-resolved';
  const triggerAlert = prediction?.trigger_alert ? 'True (Passed threshold & cooldown)' : 'False (Suppressed/Cooldown)';

  return (
    <div className="card" style={{ marginTop: '0.5rem', background: 'rgba(10, 14, 25, 0.45)', border: '1px solid var(--border-subtle)' }}>
      <div 
        onClick={() => setExpanded(!expanded)} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ 
            width: 28, 
            height: 28, 
            borderRadius: 'var(--radius-xs)', 
            background: 'rgba(108, 140, 255, 0.08)', 
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Terminal size={15} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Advanced / Developer Diagnostics
            </h4>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              Model states, WebSocket telemetry, database metrics & backend health
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${connected ? 'badge-success' : 'badge-danger'} badge-sm`}>
            {connected ? 'WS Connected' : 'WS Disconnected'}
          </span>
          {expanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* Model & Prediction State */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-primary)', fontWeight: 700 }}>
                Prediction Engine
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>Target App:</span> <strong style={{ color: 'var(--text-primary)' }}>{predictedTarget}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Confidence:</span> <strong style={{ color: 'var(--accent-highlight)' }}>{rawConfidence}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Executable:</span> <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{resolvedExecutable}</span></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Trigger Alert:</span> <span style={{ color: prediction?.trigger_alert ? 'var(--success)' : 'var(--text-muted)' }}>{triggerAlert}</span></div>
              </div>
            </div>

            {/* Core & API State */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-violet)', fontWeight: 700 }}>
                Backend & Network
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>API Gateway:</span> <code>http://127.0.0.1:8000</code></div>
                <div><span style={{ color: 'var(--text-dim)' }}>WebSocket:</span> <code>ws://127.0.0.1:8000/ws</code></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Server Status:</span> <strong style={{ color: sysStatus?.status === 'ok' || connected ? 'var(--success)' : 'var(--danger)' }}>{connected ? 'Healthy / Streaming' : 'Offline'}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Uptime:</span> <span>{sysStatus?.uptime ? `${Math.floor(sysStatus.uptime / 60)} min` : 'Active'}</span></div>
              </div>
            </div>

            {/* Database & Storage State */}
            <div style={{ padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--success)', fontWeight: 700 }}>
                Database Telemetry
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>DB Engine:</span> <strong>SQLite Local DB</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Size on Disk:</span> <strong>{dbStatus?.size_mb !== undefined ? `${dbStatus.size_mb.toFixed(2)} MB` : 'Loading...'}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Last Cleanup:</span> <span>{dbStatus?.last_cleanup || 'None recorded'}</span></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Data Privacy:</span> <strong style={{ color: 'var(--success)' }}>100% On-Device</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
