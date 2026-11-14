const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => 'http://127.0.0.1:8000',
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => ipcRenderer.on('window-maximized', (event, value) => callback(value)),
  getPlatform: () => process.platform,
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  // Legacy: simple notification without action button (backward compat)
  showNotification: (title, body, actionApp) => ipcRenderer.send('show-notification', title, body, actionApp),
  // New: prediction/recommendation notification with action object
  showPredictionNotification: (title, message, actionApp) =>
    ipcRenderer.send('show-prediction-notification', { title, message, actionApp }),
  // Test: fire a test notification that uses the same Windows toast stack
  testNotification: () => ipcRenderer.send('test-notification'),
  onNotificationAction: (callback) => {
    ipcRenderer.removeAllListeners('notification-action');
    ipcRenderer.on('notification-action', (event, appName) => callback(appName));
  }
});
