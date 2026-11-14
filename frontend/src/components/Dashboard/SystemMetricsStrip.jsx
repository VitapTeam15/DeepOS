import React from 'react';
import { Cpu, Database, HardDrive, Layers } from 'lucide-react';

export default function SystemMetricsStrip({ metrics, processCount = 0 }) {
  const cpu = metrics?.cpu ?? metrics?.data?.cpu_percent ?? 0;
  const ram = metrics?.ram ?? metrics?.data?.memory_percent ?? 0;
  const disk = metrics?.disk ?? metrics?.data?.disk_percent ?? 0;
  const totalProcesses = processCount || metrics?.data?.active_processes || 0;

  const getStatusColorClass = (val) => {
    if (val >= 85) return 'danger';
    if (val >= 65) return 'warning';
    return 'primary';
  };

  return (
    <div className="metrics-strip">
      {/* CPU Metric Card */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-name">CPU Utilization</span>
          <div className="metric-icon-wrap cpu">
            <Cpu size={16} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{Number(cpu).toFixed(1)}%</span>
          <span className="metric-sub">
            {cpu >= 80 ? 'Heavy Load' : cpu >= 50 ? 'Moderate' : 'Optimal'}
          </span>
        </div>
        <div className="metric-progress">
          <div 
            className={`metric-progress-fill ${getStatusColorClass(cpu)}`} 
            style={{ width: `${Math.min(cpu, 100)}%` }} 
          />
        </div>
      </div>

      {/* RAM Metric Card */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-name">Memory (RAM)</span>
          <div className="metric-icon-wrap ram">
            <Database size={16} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{Number(ram).toFixed(1)}%</span>
          <span className="metric-sub">
            {ram >= 85 ? 'High Pressure' : 'Normal'}
          </span>
        </div>
        <div className="metric-progress">
          <div 
            className={`metric-progress-fill ${getStatusColorClass(ram)}`} 
            style={{ width: `${Math.min(ram, 100)}%` }} 
          />
        </div>
      </div>

      {/* Disk Storage Card */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-name">Storage (Disk)</span>
          <div className="metric-icon-wrap disk">
            <HardDrive size={16} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{Number(disk).toFixed(1)}%</span>
          <span className="metric-sub">Mounted drive</span>
        </div>
        <div className="metric-progress">
          <div 
            className={`metric-progress-fill ${disk > 90 ? 'danger' : 'success'}`} 
            style={{ width: `${Math.min(disk, 100)}%` }} 
          />
        </div>
      </div>

      {/* Active Processes Card */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-name">Active Tasks</span>
          <div className="metric-icon-wrap process">
            <Layers size={16} />
          </div>
        </div>
        <div className="metric-value-row">
          <span className="metric-value">{totalProcesses || '—'}</span>
          <span className="metric-sub">Processes</span>
        </div>
        <div className="metric-progress">
          <div 
            className="metric-progress-fill primary" 
            style={{ width: totalProcesses ? '65%' : '0%' }} 
          />
        </div>
      </div>
    </div>
  );
}
