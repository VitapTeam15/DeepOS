import React, { useState } from 'react';
import TerminateDialog from './TerminateDialog';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Database, 
  AppWindow, 
  Terminal, 
  Trash2, 
  AlertCircle 
} from 'lucide-react';

const ProcessTable = ({ processes = [], filter = '', onProcessTerminated }) => {
  const [selectedProcess, setSelectedProcess] = useState(null);

  const filtered = processes.filter(p => 
    p.name.toLowerCase().includes((filter || '').toLowerCase()) ||
    String(p.pid).includes(filter || '')
  );

  const getCpuColor = (cpu) => {
    if (cpu >= 60) return 'var(--danger)';
    if (cpu >= 25) return 'var(--warning)';
    return 'var(--text-primary)';
  };

  const getMemColor = (mem) => {
    if (mem >= 60) return 'var(--danger)';
    if (mem >= 30) return 'var(--warning)';
    return 'var(--text-primary)';
  };

  return (
    <div className="table-container">
      <table className="modern-table">
        <thead>
          <tr>
            <th>Process Name</th>
            <th>PID</th>
            <th>CPU %</th>
            <th>Memory Allocation</th>
            <th>Status</th>
            <th>Integrity</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => {
            const cpuVal = p.cpu_percent || 0;
            const memVal = p.memory_percent || 0;
            const memMb = p.memory_mb || 0;

            return (
              <tr key={p.pid}>
                {/* Process Name */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(108, 140, 255, 0.08)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AppWindow size={15} />
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                      {p.name}
                    </span>
                  </div>
                </td>

                {/* PID */}
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    {p.pid}
                  </span>
                </td>

                {/* CPU */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: getCpuColor(cpuVal), minWidth: '45px' }}>
                      {cpuVal.toFixed(1)}%
                    </span>
                    <div style={{ width: '45px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(cpuVal, 100)}%`, 
                        background: getCpuColor(cpuVal),
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                </td>

                {/* Memory */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: getMemColor(memVal), minWidth: '55px' }}>
                      {memMb.toFixed(0)} MB
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      ({memVal.toFixed(1)}%)
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span className={`badge ${p.status === 'running' ? 'badge-success' : 'badge-muted'} badge-sm`}>
                    {p.status || 'Active'}
                  </span>
                </td>

                {/* Protected Integrity Check */}
                <td>
                  {p.is_protected ? (
                    <span className="badge badge-primary badge-sm" title="System protected process">
                      <ShieldCheck size={12} /> Protected
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Shield size={12} /> Standard
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ textAlign: 'right' }}>
                  <button
                    disabled={p.is_protected}
                    className="btn btn-danger btn-sm"
                    onClick={() => setSelectedProcess(p)}
                    title={p.is_protected ? "System critical process cannot be terminated" : "Terminate process"}
                    style={{ padding: '0.3rem 0.65rem' }}
                  >
                    <Trash2 size={13} />
                    <span>Terminate</span>
                  </button>
                </td>
              </tr>
            );
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                No active processes match your search filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedProcess && (
        <TerminateDialog
          process={selectedProcess}
          onClose={() => setSelectedProcess(null)}
          onSuccess={() => {
            setSelectedProcess(null);
            if (onProcessTerminated) onProcessTerminated();
          }}
        />
      )}
    </div>
  );
};

export default ProcessTable;