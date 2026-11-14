const BASE_URL = 'http://127.0.0.1:8000/api';

const fetchAPI = async (endpoint, options = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
};

// System
export const getSystemStatus = () => fetchAPI('/system/status');
export const getSystemMetrics = () => fetchAPI('/system/metrics');
export const getSystemMetricsHistory = (hours = 24) => fetchAPI(`/system/metrics/history?hours=${hours}`);

// Processes
export const getProcesses = () => fetchAPI('/processes/');
export const getTopCpuProcesses = (n = 5) => fetchAPI(`/processes/top/cpu?n=${n}`);
export const getTopMemoryProcesses = (n = 5) => fetchAPI(`/processes/top/memory?n=${n}`);
export const terminateProcess = (pid) => fetchAPI(`/processes/${pid}/terminate?confirm=true`, { method: 'POST' });

// Applications
export const getApplications = () => fetchAPI('/applications/');
export const getApplicationHistory = () => fetchAPI('/applications/history');
export const launchApplication = (app_name) => fetchAPI('/applications/launch', { method: 'POST', body: JSON.stringify({ app_name }) });

// Prediction
export const getPrediction = () => fetchAPI('/prediction/');
export const getModelMetrics = () => fetchAPI('/prediction/model');
export const trainModel = () => fetchAPI('/prediction/train', { method: 'POST' });

// Recommendations
export const getRecommendations = () => fetchAPI('/recommendations/');
export const getRecommendationHistory = () => fetchAPI('/recommendations/history');
export const dismissRecommendation = (id) => fetchAPI(`/recommendations/${id}/dismiss`, { method: 'POST' });
export const acceptRecommendation = (id) => fetchAPI(`/recommendations/${id}/accept`, { method: 'POST' });

// Focus Mode
export const getFocusMode = () => fetchAPI('/focus/');
export const setFocusMode = (enabled, level) => fetchAPI('/focus/', { method: 'POST', body: JSON.stringify({ enabled, level }) });

// Settings
export const getSettings = () => fetchAPI('/settings/');
export const updateSettings = (settings) => fetchAPI('/settings/', { method: 'POST', body: JSON.stringify(settings) });
export const speakPrediction = (message) => fetchAPI('/settings/speak-prediction', { method: 'POST', body: JSON.stringify({ message }) });
export const testAudio = () => fetchAPI('/settings/test-audio', { method: 'POST' });
export const testNotificationBackend = () => fetchAPI('/settings/test-notification', { method: 'POST' });

// Database
export const getDatabaseStatus = () => fetchAPI('/database/status');
export const triggerCleanup = () => fetchAPI('/database/cleanup', { method: 'POST' });
