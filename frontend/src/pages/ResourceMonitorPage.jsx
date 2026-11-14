import React, { useState, useEffect } from 'react';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { getTopCpuProcesses, getTopMemoryProcesses } from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw,
  Flame
} from 'lucide-react';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';

export default function ResourceMonitorPage() {
  const { metrics, history, connected } = useSystemMetrics();
  const [topCpu, setTopCpu] = useState([]);
  const [topMem, setTopMem] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTop = async () => {
      try {
        const cpu = await getTopCpuProcesses(5);
        const mem = await getTopMemoryProcesses(5);
        
        if (isMounted) {
          setTopCpu(cpu?.processes || []);
          setTopMem(mem?.processes || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('[ResourceMonitor] Failed to fetch top consumers:', err);
      }
    };
    
    fetchTop();
    const interval = setInterval(fetchTop, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatTime = (tick) => {
    if (!tick) return '';
    try {
      const date = new Date(tick);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const pressure = metrics?.data?.pressure || { 
    cpu_pressure: 'normal', 
    ram_pressure: 'normal', 
    disk_pressure: 'normal' 
  };

  const getPressureBadge = (level = 'normal') => {
    const l = level.toLowerCase();
    if (l === 'critical' || l === 'high') return { variant: 'danger', label: 'High Pressure' };
    if (l === 'warning' || l === 'moderate') return { variant: 'warning', label: 'Elevated' };
    return { variant: 'success', label: 'Normal' };
  };

  const currentCpu = metrics?.cpu ?? metrics?.data?.cpu_percent ?? 0;
  const currentRam = metrics?.ram ?? metrics?.data?.memory_percent ?? 0;
  const currentDisk = metrics?.disk ?? metrics?.data?.disk_percent ?? 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">System Telemetry & Hardware Monitor</h1>
          <p className="page-header-desc">
            Real-time operating system performance curves and workload pressure analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${connected ? 'badge-success' : 'badge-danger'}`}>
            <Activity size={13} />
            <span>{connected ? 'Streaming Live (1s)' : 'Offline'}</span>
          </span>
        </div>
      </div>

      {/* Hardware Pressure Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {/* CPU Pressure */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              CPU Core Engine
            </span>
            {(() => {
              const b = getPressureBadge(pressure.cpu_pressure);
              return <span className={`badge badge-${b.variant} badge-sm`}>{b.label}</span>;
            })()}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}>
            {Number(currentCpu).toFixed(1)}%
          </div>
          <div className="metric-progress" style={{ marginTop: '0.65rem' }}>
            <div 
              className={`metric-progress-fill ${currentCpu > 80 ? 'danger' : currentCpu > 50 ? 'warning' : 'primary'}`} 
              style={{ width: `${Math.min(currentCpu, 100)}%` }} 
            />
          </div>
        </div>

        {/* RAM Pressure */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Memory Pool (RAM)
            </span>
            {(() => {
              const b = getPressureBadge(pressure.ram_pressure);
              return <span className={`badge badge-${b.variant} badge-sm`}>{b.label}</span>;
            })()}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-violet)', letterSpacing: '-0.02em' }}>
            {Number(currentRam).toFixed(1)}%
          </div>
          <div className="metric-progress" style={{ marginTop: '0.65rem' }}>
            <div 
              className={`metric-progress-fill ${currentRam > 85 ? 'danger' : 'violet'}`} 
              style={{ width: `${Math.min(currentRam, 100)}%` }} 
            />
          </div>
        </div>

        {/* Disk Pressure */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Storage System
            </span>
            {(() => {
              const b = getPressureBadge(pressure.disk_pressure);
              return <span className={`badge badge-${b.variant} badge-sm`}>{b.label}</span>;
            })()}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--success)', letterSpacing: '-0.02em' }}>
            {Number(currentDisk).toFixed(1)}%
          </div>
          <div className="metric-progress" style={{ marginTop: '0.65rem' }}>
            <div 
              className="metric-progress-fill success" 
              style={{ width: `${Math.min(currentDisk, 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Real-time History Curves Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* CPU Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Cpu size={16} />
              </div>
              <div>
                <h3>CPU Workload Timeline</h3>
                <p>Streaming 60-second usage history</p>
              </div>
            </div>
            <span className="badge badge-primary">{Number(currentCpu).toFixed(0)}% Live</span>
          </div>

          <div className="card-body" style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuStreamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C8CFF" stopOpacity={0.65}/>
                    <stop offset="95%" stopColor="#6C8CFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 140, 255, 0.08)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#62718D" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#62718D" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F1524', 
                    borderColor: 'rgba(108, 140, 255, 0.25)', 
                    borderRadius: '8px',
                    color: '#F3F6FC',
                    fontSize: '12px'
                  }} 
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'CPU']}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#6C8CFF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#cpuStreamGradient)" 
                  isAnimationActive={false} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Database size={16} />
              </div>
              <div>
                <h3>Memory (RAM) Allocation</h3>
                <p>Streaming memory saturation history</p>
              </div>
            </div>
            <span className="badge badge-primary">{Number(currentRam).toFixed(0)}% Live</span>
          </div>

          <div className="card-body" style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ramStreamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.65}/>
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108, 140, 255, 0.08)" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#62718D" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#62718D" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F1524', 
                    borderColor: 'rgba(124, 92, 255, 0.25)', 
                    borderRadius: '8px',
                    color: '#F3F6FC',
                    fontSize: '12px'
                  }} 
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'RAM']}
                />
                <Area 
                  type="monotone" 
                  dataKey="ram" 
                  stroke="#7C5CFF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#ramStreamGradient)" 
                  isAnimationActive={false} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Consumers Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top CPU Consumers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Flame size={16} />
              </div>
              <div>
                <h3>Top 5 CPU Consumers</h3>
                <p>Processes utilizing peak CPU computation cycles</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {topCpu.map((p, i) => (
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
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ 
                      fontSize: '0.82rem', 
                      fontWeight: 700, 
                      color: p.cpu_percent > 30 ? 'var(--warning)' : 'var(--accent-primary)' 
                    }}>
                      {p.cpu_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {topCpu.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Awaiting telemetry updates...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Memory Consumers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <Database size={16} />
              </div>
              <div>
                <h3>Top 5 Memory Consumers</h3>
                <p>Processes with largest resident memory footprints</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {topMem.map((p, i) => (
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
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                  <span style={{ 
                    fontSize: '0.82rem', 
                    fontWeight: 700, 
                    color: 'var(--accent-violet)' 
                  }}>
                    {p.memory_mb.toFixed(0)} MB
                  </span>
                </div>
              ))}
              {topMem.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Awaiting telemetry updates...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}