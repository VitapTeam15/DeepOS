import os

base_dir = r'd:\DeepOs\frontend'
os.makedirs(base_dir, exist_ok=True)

files = { 
    'package.json': '''{
  "name": "deep-os-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "recharts": "^2.15.0",
    "lucide-react": "^0.469.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5"
  }
}''',

    'vite.config.js': '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true
      }
    }
  }
})''',

    'index.html': '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧠</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deep OS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>''',

    'src/index.css': '''
:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;  
  --bg-card: rgba(17, 24, 39, 0.85);
  --bg-card-hover: rgba(17, 24, 39, 0.95);
  --border-color: rgba(99, 102, 241, 0.15);
  --border-hover: rgba(99, 102, 241, 0.3);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-card: 0 4px 24px rgba(0,0,0,0.3);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
::selection { background-color: var(--accent-primary); color: white; }

.card {
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
  transition: var(--transition);
}
.card:hover { transform: translateY(-2px); border-color: var(--border-hover); background: var(--bg-card-hover); }

.card-header { border-left: 4px solid var(--accent-primary); padding-left: 1rem; margin-bottom: 1rem; }

.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-primary { background: var(--accent-gradient); color: white; }
.btn-primary:hover { opacity: 0.9; box-shadow: 0 0 12px rgba(99, 102, 241, 0.4); }
.btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }

.badge { padding: 0.25rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
.badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
.badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
.badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }

.table { width: 100%; border-collapse: collapse; }
.table th { text-align: left; padding: 1rem; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border-color); }
.table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
.table tr:hover td { background: rgba(255,255,255,0.02); }

.sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-color); padding: 1.5rem; z-index: 10; }
.main-content { margin-left: 260px; padding: 2rem; min-height: 100vh; }

.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }

.stat-value { font-size: 2.5rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
.pulse { animation: pulse 2s infinite; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeIn 0.4s ease-out forwards; }

.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
''',

    'src/main.jsx': '''import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);''',

    'src/App.jsx': '''import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import ResourceMonitorPage from './pages/ResourceMonitorPage';
import ProcessesPage from './pages/ProcessesPage';
import ApplicationHistoryPage from './pages/ApplicationHistoryPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/resources" element={<ResourceMonitorPage />} />
        <Route path="/processes" element={<ProcessesPage />} />
        <Route path="/history" element={<ApplicationHistoryPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
export default App;''',

    'src/services/api.js': '''const BASE_URL = '/api';
const fetchAPI = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export const getSystemStatus = () => fetchAPI('/status');
export const getSystemMetrics = () => fetchAPI('/metrics');
export const getProcesses = () => fetchAPI('/processes');
export const terminateProcess = (pid) => fetchAPI(`/processes/${pid}/terminate`, { method: 'POST' });
export const getApplications = () => fetchAPI('/applications');
export const getApplicationHistory = () => fetchAPI('/history');
export const getPrediction = () => fetchAPI('/prediction');
export const getRecommendations = () => fetchAPI('/recommendations');
export const getRecommendationHistory = () => fetchAPI('/recommendations/history');
export const dismissRecommendation = (id) => fetchAPI(`/recommendations/${id}/dismiss`, { method: 'POST' });
export const acceptRecommendation = (id) => fetchAPI(`/recommendations/${id}/accept`, { method: 'POST' });
export const getFocusMode = () => fetchAPI('/focus');
export const setFocusMode = (enabled, level) => fetchAPI('/focus', { method: 'POST', body: JSON.stringify({ enabled, level }) });
export const getSettings = () => fetchAPI('/settings');
export const updateSettings = (settings) => fetchAPI('/settings', { method: 'PUT', body: JSON.stringify(settings) });
export const getDatabaseStatus = () => fetchAPI('/database/status');
export const triggerCleanup = () => fetchAPI('/database/cleanup', { method: 'POST' });
''',

    'src/hooks/useSystemMetrics.js': '''import { useState, useEffect } from 'react';

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let reconnectTimer;
    const connect = () => {
      ws = new WebSocket(`ws://${window.location.host}/ws`);
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMetrics(data);
        setHistory(prev => [...prev.slice(-59), data]);
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimer); if(ws) ws.close(); };
  }, []);

  return { metrics, history, connected };
}''',

    'src/hooks/useProcesses.js': '''import { useState, useEffect } from 'react';
import { getProcesses } from '../services/api';

export function useProcesses() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProcs = async () => {
    try {
      const data = await getProcesses();
      setProcesses(data);
      setError(null);
    } catch(err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcs();
    const interval = setInterval(fetchProcs, 5000);
    return () => clearInterval(interval);
  }, []);

  return { processes, loading, error, refetch: fetchProcs };
}''',

    'src/hooks/usePrediction.js': '''import { useState, useEffect } from 'react';
import { getPrediction } from '../services/api';

export function usePrediction() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPred = async () => {
      try {
        const data = await getPrediction();
        setPrediction(data);
      } catch(err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchPred();
    const interval = setInterval(fetchPred, 30000);
    return () => clearInterval(interval);
  }, []);

  return { prediction, loading };
}''',

    'src/hooks/useSettings.js': '''import { useState, useEffect } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/api';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      await apiUpdateSettings(newSettings);
      setSettings(newSettings);
    } catch(err) {
      console.error(err);
    }
  };

  return { settings, updateSettings, loading };
}''',

    'src/utils/formatters.js': '''export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export const formatPercent = (val) => `${Number(val).toFixed(1)}%`;
export const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};
export const formatTime = (ts) => new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
export const getStatusColor = (val, { warn, crit }) => val >= crit ? 'var(--danger)' : val >= warn ? 'var(--warning)' : 'var(--success)';
export const getStatusLabel = (val, { warn, crit }) => val >= crit ? 'Critical' : val >= warn ? 'Warning' : 'Normal';
''',

    'src/components/Layout/Sidebar.jsx': '''import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, Cpu, Clock, Lightbulb, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const navs = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Resource Monitor', path: '/resources', icon: Activity },
    { name: 'Processes', path: '/processes', icon: Cpu },
    { name: 'App History', path: '/history', icon: Clock },
    { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="sidebar">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Deep OS</h1>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navs.map(n => {
          const Icon = n.icon;
          const active = location.pathname === n.path;
          return (
            <Link key={n.path} to={n.path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: active ? 'white' : 'var(--text-secondary)', background: active ? 'rgba(255,255,255,0.05)' : 'transparent', borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent' }}>
              <Icon size={20} />
              {n.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}''',

    'src/components/Layout/Header.jsx': '''import { Bell } from 'lucide-react';
export default function Header({ title }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h2>{title}</h2>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button className="btn btn-ghost" style={{ position: 'relative' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }}></span>
        </button>
      </div>
    </header>
  );
}''',

    'src/components/Layout/Layout.jsx': '''import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();
  const titles = { '/': 'Dashboard', '/resources': 'Resource Monitor', '/processes': 'Processes', '/history': 'App History', '/recommendations': 'Recommendations', '/settings': 'Settings' };
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ flex: 1 }}>
        <Header title={titles[location.pathname] || 'Deep OS'} />
        {children}
      </div>
    </div>
  );
}''',

    'src/components/Dashboard/SystemCard.jsx': '''import GaugeRing from '../Common/GaugeRing';
import { getStatusColor, getStatusLabel } from '../../utils/formatters';

export default function SystemCard({ title, value, total, thresholds }) {
  const color = getStatusColor(value, thresholds);
  const critical = value >= thresholds.crit;
  return (
    <div className={`card ${critical ? 'pulse' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <h3>{title}</h3>
      <GaugeRing value={value} color={color} size={120} strokeWidth={10} />
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ color }}>{getStatusLabel(value, thresholds)}</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{total}</p>
      </div>
    </div>
  );
}''',

    'src/components/Dashboard/PredictionCard.jsx': '''export default function PredictionCard({ prediction }) {
  if (!prediction) return <div className="card">Loading prediction...</div>;
  return (
    <div className="card">
      <div className="card-header">
        <h3>AI Prediction</h3>
      </div>
      <div style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Next app likely to be used:</p>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{prediction.appName || 'Not enough data'}</h2>
        {prediction.confidence && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Confidence</span>
              <span>{Math.round(prediction.confidence * 100)}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prediction.confidence * 100}%`, background: 'var(--accent-gradient)' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}''',

    'src/components/Dashboard/RecommendationCard.jsx': '''export default function RecommendationCard({ recommendations = [] }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Active Recommendations</h3>
      </div>
      {recommendations.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No active recommendations</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map((rec, i) => (
            <div key={i} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{rec.message}</strong>
                <span className={`badge badge-${rec.severity === 'high' ? 'danger' : 'warning'}`}>{rec.severity}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{rec.reason}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Accept</button>
                <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}''',

    'src/components/Dashboard/FocusModeCard.jsx': '''import Toggle from '../Common/Toggle';

export default function FocusModeCard({ enabled, level, onToggle, onLevelChange }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Focus Mode</h3>
        <Toggle checked={enabled} onChange={onToggle} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        {['Light', 'Balanced', 'Deep'].map(l => (
          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: enabled ? 1 : 0.5 }}>
            <input type="radio" name="focusLevel" checked={level === l} onChange={() => enabled && onLevelChange(l)} disabled={!enabled} />
            {l}
          </label>
        ))}
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {level === 'Light' ? 'Blocks notifications.' : level === 'Balanced' ? 'Blocks notifications and non-essential apps.' : 'Strict mode. Only whitelisted apps allowed.'}
      </p>
    </div>
  );
}''',

    'src/components/Charts/CpuChart.jsx': '''import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CpuChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="cpu" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}''',

    'src/components/Charts/RamChart.jsx': '''import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RamChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="ram" stroke="var(--success)" fillOpacity={1} fill="url(#colorRam)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}''',

    'src/components/Charts/DiskChart.jsx': '''import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DiskChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--info)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="disk" stroke="var(--info)" fillOpacity={1} fill="url(#colorDisk)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}''',

    'src/components/Charts/UsageChart.jsx': '''import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function UsageChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 50 }}>
          <XAxis type="number" stroke="var(--text-muted)" />
          <YAxis type="category" dataKey="name" stroke="var(--text-primary)" />
          <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
          <Bar dataKey="usage" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}''',

    'src/components/Process/ProcessTable.jsx': '''import { useState } from 'react';
import TerminateDialog from './TerminateDialog';

export default function ProcessTable({ processes }) {
  const [termPid, setTermPid] = useState(null);
  
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>PID</th>
              <th>CPU %</th>
              <th>Memory %</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map(p => (
              <tr key={p.pid}>
                <td>{p.name} {p.protected && <span className="badge badge-success" style={{marginLeft: '0.5rem'}}>Shield</span>}</td>
                <td>{p.pid}</td>
                <td style={{ color: p.cpu > 50 ? 'var(--danger)' : p.cpu > 20 ? 'var(--warning)' : 'var(--success)' }}>{p.cpu.toFixed(1)}%</td>
                <td style={{ color: p.memory > 50 ? 'var(--danger)' : p.memory > 20 ? 'var(--warning)' : 'var(--success)' }}>{p.memory.toFixed(1)}%</td>
                <td>
                  {!p.protected && (
                    <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setTermPid(p)}>
                      Terminate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {termPid && <TerminateDialog process={termPid} onClose={() => setTermPid(null)} onConfirm={() => { console.log('Terminate', termPid.pid); setTermPid(null); }} />}
    </>
  );
}''',

    'src/components/Process/TerminateDialog.jsx': '''import ConfirmDialog from '../Common/ConfirmDialog';

export default function TerminateDialog({ process, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      title="Terminate Process?"
      message={`Are you sure you want to terminate ${process.name} (PID: ${process.pid})? Unsaved work may be lost.`}
      confirmText="Terminate"
      cancelText="Cancel"
      variant="danger"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}''',

    'src/components/Notifications/NotificationToast.jsx': '''export default function NotificationToast({ message, type = 'info', onClose }) {
  const borderColors = { info: 'var(--info)', warning: 'var(--warning)', danger: 'var(--danger)' };
  return (
    <div className="card fade-in" style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, borderLeft: `4px solid ${borderColors[type]}`, minWidth: 250 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p>{message}</p>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
      </div>
    </div>
  );
}''',

    'src/components/Notifications/NotificationCenter.jsx': '''export default function NotificationCenter() {
  return <div className="card">Notifications here</div>;
}''',

    'src/components/Common/StatusBadge.jsx': '''export default function StatusBadge({ status }) {
  const colors = { normal: 'success', warning: 'warning', critical: 'danger' };
  return <span className={`badge badge-${colors[status.toLowerCase()] || 'info'}`}>{status}</span>;
}''',

    'src/components/Common/GaugeRing.jsx': '''export default function GaugeRing({ value, size = 100, strokeWidth = 8, color = 'var(--accent-primary)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="var(--bg-secondary)" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      </svg>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.2, fontWeight: 'bold' }}>
        {Math.round(value)}%
      </div>
    </div>
  );
}''',

    'src/components/Common/Toggle.jsx': '''export default function Toggle({ checked, onChange }) {
  return (
    <div style={{ width: 40, height: 20, background: checked ? 'var(--accent-primary)' : 'var(--bg-secondary)', borderRadius: 20, position: 'relative', cursor: 'pointer', transition: 'var(--transition)' }} onClick={onChange}>
      <div style={{ width: 16, height: 16, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: checked ? 22 : 2, transition: 'var(--transition)' }}></div>
    </div>
  );
}''',

    'src/components/Common/ConfirmDialog.jsx': '''export default function ConfirmDialog({ title, message, confirmText, cancelText, variant = 'primary', onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card fade-in" style={{ maxWidth: 400, width: '100%' }}>
        <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button className={`btn btn-${variant}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}''',

    'src/pages/DashboardPage.jsx': '''import SystemCard from '../components/Dashboard/SystemCard';
import PredictionCard from '../components/Dashboard/PredictionCard';
import RecommendationCard from '../components/Dashboard/RecommendationCard';
import FocusModeCard from '../components/Dashboard/FocusModeCard';

export default function DashboardPage() {
  const dummyMetrics = { cpu: 45, ram: 60, disk: 30 };
  const thresholds = { warn: 70, crit: 90 };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-3">
        <SystemCard title="CPU Usage" value={dummyMetrics.cpu} total="3.2 GHz" thresholds={thresholds} />
        <SystemCard title="Memory Usage" value={dummyMetrics.ram} total="16 GB" thresholds={thresholds} />
        <SystemCard title="Disk Usage" value={dummyMetrics.disk} total="512 GB" thresholds={thresholds} />
      </div>
      <div className="grid-2">
        <PredictionCard prediction={{ appName: 'VS Code', confidence: 0.85 }} />
        <RecommendationCard recommendations={[{ message: 'Close Chrome', severity: 'warning', reason: 'High memory usage' }]} />
      </div>
      <div className="grid-3">
        <FocusModeCard enabled={true} level="Balanced" onToggle={() => {}} onLevelChange={() => {}} />
      </div>
    </div>
  );
}''',

    'src/pages/ResourceMonitorPage.jsx': '''import CpuChart from '../components/Charts/CpuChart';
import RamChart from '../components/Charts/RamChart';
import DiskChart from '../components/Charts/DiskChart';

export default function ResourceMonitorPage() {
  const dummyData = Array.from({length: 20}).map((_, i) => ({ time: i, cpu: Math.random()*100, ram: Math.random()*100, disk: 50 }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card">
        <h3>CPU History</h3>
        <CpuChart data={dummyData} />
      </div>
      <div className="card">
        <h3>Memory History</h3>
        <RamChart data={dummyData} />
      </div>
      <div className="card">
        <h3>Disk History</h3>
        <DiskChart data={dummyData} />
      </div>
    </div>
  );
}''',

    'src/pages/ProcessesPage.jsx': '''import ProcessTable from '../components/Process/ProcessTable';

export default function ProcessesPage() {
  const dummyProcs = [
    { pid: 1, name: 'System', cpu: 1.2, memory: 5.5, protected: true },
    { pid: 1234, name: 'Chrome', cpu: 45.0, memory: 25.0, protected: false }
  ];
  return (
    <div className="card">
      <div className="card-header">
        <h3>Running Processes</h3>
      </div>
      <ProcessTable processes={dummyProcs} />
    </div>
  );
}''',

    'src/pages/ApplicationHistoryPage.jsx': '''import UsageChart from '../components/Charts/UsageChart';

export default function ApplicationHistoryPage() {
  const data = [{ name: 'VS Code', usage: 120 }, { name: 'Chrome', usage: 90 }, { name: 'Slack', usage: 45 }];
  return (
    <div className="card">
      <div className="card-header">
        <h3>Most Used Applications</h3>
      </div>
      <UsageChart data={data} />
    </div>
  );
}''',

    'src/pages/RecommendationsPage.jsx': '''import RecommendationCard from '../components/Dashboard/RecommendationCard';

export default function RecommendationsPage() {
  return (
    <div>
      <RecommendationCard recommendations={[
        { message: 'Update Windows', severity: 'high', reason: 'Security patch available' }
      ]} />
    </div>
  );
}''',

    'src/pages/SettingsPage.jsx': '''export default function SettingsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Settings</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)' }}>Settings configuration options go here.</p>
    </div>
  );
}'''
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Frontend scaffolded successfully.')
