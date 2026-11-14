import React, { useState, useEffect } from 'react';
import { useSystemMetrics } from '../hooks/useSystemMetrics';
import { usePrediction } from '../hooks/usePrediction';
import { getRecommendations, dismissRecommendation, acceptRecommendation, getFocusMode, setFocusMode } from '../services/api';
import PredictionCard from '../components/Dashboard/PredictionCard';
import RecommendationCard from '../components/Dashboard/RecommendationCard';
import FocusModeCard from '../components/Dashboard/FocusModeCard';
import { Activity, Cpu, HardDrive, Database } from 'lucide-react';

const DashboardPage = () => {
  const { metrics, connected } = useSystemMetrics();
  const { prediction, loading: predictionLoading, refetch: refetchPrediction } = usePrediction();
  
  const [recommendations, setRecommendations] = useState([]);
  const [focusState, setFocusState] = useState({ enabled: false, level: 1 });

  const fetchRecommendations = async () => {
    try {
      const data = await getRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    }
  };

  const fetchFocus = async () => {
    try {
      const data = await getFocusMode();
      setFocusState(data);
    } catch (err) {
      console.error('Failed to fetch focus mode', err);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchFocus();
    
    const recInterval = setInterval(fetchRecommendations, 15000);
    return () => clearInterval(recInterval);
  }, []);

  const handleDismiss = async (id) => {
    await dismissRecommendation(id);
    fetchRecommendations();
  };

  const handleAccept = async (id) => {
    await acceptRecommendation(id);
    fetchRecommendations();
  };

  const handleFocusToggle = async (enabled) => {
    const newState = { ...focusState, enabled };
    setFocusState(newState);
    await setFocusMode(newState.enabled, newState.level);
  };

  const handleFocusLevel = async (level) => {
    const newState = { ...focusState, level };
    setFocusState(newState);
    await setFocusMode(newState.enabled, newState.level);
  };

  const currentMetrics = metrics || { cpu: 0, ram: 0, disk: 0 };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Dashboard</h1>
        <div className="status-badges">
          <span className={`badge ${connected ? 'badge-success' : 'badge-error'}`}>
            {connected ? 'Real-time Live' : 'Disconnected'}
          </span>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="system-overview-cards">
          <div className="card stat-card">
            <Cpu className="stat-icon text-primary" />
            <div className="stat-content">
              <h3>CPU Usage</h3>
              <h2>{currentMetrics.cpu.toFixed(1)}%</h2>
            </div>
          </div>
          <div className="card stat-card">
            <Database className="stat-icon text-warning" />
            <div className="stat-content">
              <h3>Memory Usage</h3>
              <h2>{currentMetrics.ram.toFixed(1)}%</h2>
            </div>
          </div>
          <div className="card stat-card">
            <HardDrive className="stat-icon text-success" />
            <div className="stat-content">
              <h3>Disk Usage</h3>
              <h2>{currentMetrics.disk.toFixed(1)}%</h2>
            </div>
          </div>
        </div>

        <div className="dashboard-main-row">
          <PredictionCard prediction={prediction} loading={predictionLoading} onRefetch={refetchPrediction} />
          <FocusModeCard 
            enabled={focusState.enabled} 
            level={focusState.level} 
            onToggle={handleFocusToggle} 
            onLevelChange={handleFocusLevel} 
          />
        </div>

        <div className="dashboard-bottom-row mt-4">
          <RecommendationCard 
            recommendations={recommendations} 
            onDismiss={handleDismiss} 
            onAccept={handleAccept} 
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;