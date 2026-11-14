const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const http = require('http');

let tray = null;
let updateInterval = null;

function createTray(mainWindow, quitCallback) {
  let iconPath = path.join(__dirname, 'icon.ico');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty(); // Fallback if no icon
  }

  tray = new Tray(icon);
  
  tray.setToolTip('Deep OS - System Status: Checking...');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Deep OS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Focus Mode',
      submenu: [
        { label: 'Off', type: 'radio', checked: true },
        { label: 'Light', type: 'radio' },
        { label: 'Balanced', type: 'radio' },
        { label: 'Deep', type: 'radio' }
      ]
    },
    {
      label: 'System Status',
      enabled: false, // Just for display
      id: 'system-status'
    },
    { type: 'separator' },
    {
      label: 'Pause Monitoring',
      type: 'checkbox',
      click: (menuItem) => {
        const isPaused = menuItem.checked;
        console.log(`Monitoring paused: ${isPaused}`);
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        if (quitCallback) quitCallback();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

module.exports = { createTray };
