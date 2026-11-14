import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import PredictionsPage from './pages/PredictionsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ApplicationHistoryPage from './pages/ApplicationHistoryPage';
import ProcessesPage from './pages/ProcessesPage';
import ResourceMonitorPage from './pages/ResourceMonitorPage';
import FocusModePage from './pages/FocusModePage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/applications" element={<ApplicationHistoryPage />} />
        <Route path="/history" element={<ApplicationHistoryPage />} />
        <Route path="/processes" element={<ProcessesPage />} />
        <Route path="/system" element={<ResourceMonitorPage />} />
        <Route path="/resources" element={<ResourceMonitorPage />} />
        <Route path="/focus" element={<FocusModePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;