import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Clock, Minus, Square, X, Wifi, WifiOff, Bell } from 'lucide-react';

const PAGE_META = {
  '/': {
    title: 'Overview',
    subtitle: 'Your system intelligence at a glance'
  },
  '/predictions': {
    title: 'AI Predictions',
    subtitle: 'Real-time workflow forecasting and pattern signals'
  },
  '/recommendations': {
    title: 'Recommendations',
    subtitle: 'Contextual optimization proposals and proactive actions'
  },
  '/applications': {
    title: 'Application Activity',
    subtitle: 'Usage history, launch frequencies, and workflow sequences'
  },
  '/history': {
    title: 'Application Activity',
    subtitle: 'Usage history, launch frequencies, and workflow sequences'
  },
  '/processes': {
    title: 'Process Manager',
    subtitle: 'Active processes, hardware consumption, and resource control'
  },
  '/system': {
    title: 'System Monitor',
    subtitle: 'Telemetry, CPU/RAM performance curves, and pressure indicators'
  },
  '/resources': {
    title: 'System Monitor',
    subtitle: 'Telemetry, CPU/RAM performance curves, and pressure indicators'
  },
  '/focus': {
    title: 'Focus Mode',
    subtitle: 'Distraction suppression, session timers, and workflow optimization'
  },
  '/settings': {
    title: 'System Settings',
    subtitle: 'Prediction engine weights, notifications, audio, and hardware limits'
  }
};

export default function Header({ isConnected = true, isAIEngineActive = true }) {
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || {
    title: 'Deep OS',
    subtitle: 'Futuristic Desktop Intelligence System'
  };

  const [currentTime, setCurrentTime] = useState('');
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) window.electronAPI.minimizeWindow();
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeWindow) window.electronAPI.maximizeWindow();
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) window.electronAPI.closeWindow();
  };

  return (
    <header className="header-bar">
      <div className="header-left">
        <h1 className="header-title">{meta.title}</h1>
        <p className="header-subtitle">{meta.subtitle}</p>
      </div>

      <div className="header-right">
        {/* AI Engine Status Indicator */}
        <div className="ai-status-pill" title="Prediction & Recommendation engine is active">
          <Sparkles size={14} className="ai-status-sparkle" />
          <span>Deep OS Intelligence</span>
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: isAIEngineActive ? 'var(--accent-highlight)' : 'var(--text-dim)',
            boxShadow: isAIEngineActive ? '0 0 8px var(--accent-highlight)' : 'none'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
            {isAIEngineActive ? 'Active' : 'Standby'}
          </span>
        </div>

        {/* Live Connectivity Badge */}
        <div 
          className={`badge ${isConnected ? 'badge-success' : 'badge-danger'}`}
          title={isConnected ? 'Connected to local FastAPI backend via WebSocket' : 'Backend connection unavailable'}
        >
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'Core Live' : 'Offline'}</span>
        </div>

        {/* Real-time Clock */}
        <div className="header-clock" title="System Time">
          <Clock size={13} style={{ color: 'var(--accent-primary)' }} />
          <span>{currentTime}</span>
        </div>

        {/* Native Electron Window Controls */}
        {isElectron && (
          <div className="window-controls">
            <button className="win-btn" onClick={handleMinimize} title="Minimize">
              <Minus size={14} />
            </button>
            <button className="win-btn" onClick={handleMaximize} title="Maximize">
              <Square size={12} />
            </button>
            <button className="win-btn close" onClick={handleClose} title="Close">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}