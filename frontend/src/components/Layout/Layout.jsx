import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import { usePrediction } from '../../hooks/usePrediction';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { connected } = useSystemMetrics();
  const { prediction } = usePrediction();

  const isAIEngineActive = connected && !!prediction;

  return (
    <div className="layout">
      <Sidebar 
        collapsed={collapsed} 
        onToggleCollapse={() => setCollapsed(!collapsed)} 
        isConnected={connected}
        isAIEngineActive={isAIEngineActive}
      />
      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          isConnected={connected} 
          isAIEngineActive={isAIEngineActive}
        />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;