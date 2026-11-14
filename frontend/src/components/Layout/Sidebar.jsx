import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Brain, 
  Lightbulb, 
  Layers, 
  Cpu, 
  Activity, 
  Focus, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggleCollapse, isConnected = true, isAIEngineActive = true }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/predictions', label: 'Predictions', icon: Brain, badge: 'AI' },
    { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
    { to: '/applications', label: 'Applications', icon: Layers },
    { to: '/processes', label: 'Processes', icon: Cpu },
    { to: '/system', label: 'System', icon: Activity },
    { to: '/focus', label: 'Focus Mode', icon: Focus },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <NavLink to="/" className="brand-wrapper" title="Deep OS">
          <div className="brand-logo-icon">
            <Zap size={18} fill="currentColor" />
          </div>
          {!collapsed && (
            <div className="brand-info">
              <h2>
                Deep OS
                <span className="brand-badge">2.0</span>
              </h2>
            </div>
          )}
        </NavLink>
        <button 
          className="collapse-btn" 
          onClick={onToggleCollapse} 
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="nav-section-label">Core OS</span>}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="nav-icon" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="nav-pill">{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="sidebar-footer">
        <div className={`system-status-card ${isConnected ? 'online' : 'offline'}`}>
          <span className="status-dot-pulse" />
          {!collapsed && (
            <div className="status-info">
              <span className="status-title">
                {isConnected ? 'Deep OS Intelligence' : 'Connecting to Core...'}
              </span>
              <span className="status-subtitle">
                {isConnected ? (isAIEngineActive ? 'Engine: Active' : 'Engine: Idle') : 'Backend Offline'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;