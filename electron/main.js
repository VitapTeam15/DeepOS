const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');
const notifier = require('node-notifier');
const { createTray } = require('./tray');

let mainWindow;
let backendProcess = null;
let isQuitting = false;
let tray = null;
const isDev = !app.isPackaged;
const PORT = 8000;

// ─── Windows Toast Notification Helper ────────────────────────────────────────
// Electron's Notification.actions only works on macOS. On Windows we use
// node-notifier's WindowsToaster (snoretoast) which supports real action
// buttons via the Windows 10/11 toast notification system.
//
// Button label: we use a STABLE label "Open Application" regardless of the
// specific app name. This guarantees the snoretoast response-matching never
// fails due to capitalisation, special characters, or long names.
// The friendly app name is shown in the notification *message* body instead.

const OPEN_BTN_LABEL = 'Open Application';

function showWindowsToast({ title, message, actionApp = null, isTest = false }) {
  console.log('[NOTIFICATION] showWindowsToast called');
  console.log(`[NOTIFICATION] Title:     ${title}`);
  console.log(`[NOTIFICATION] Message:   ${message}`);
  console.log(`[NOTIFICATION] ActionApp: ${actionApp}`);

  // Build icon path — only include if it actually exists
  const fs = require('fs');
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  const hasIcon = fs.existsSync(iconPath);

  const toastOptions = {
    title:   title,
    message: message,
    sound:   false,
    wait:    true,    // Keep toast alive until user dismisses or clicks
    appID:  'Deep OS',
  };

  if (hasIcon) {
    toastOptions.icon = iconPath;
  }

  // Attach action button whenever we have a launch target
  if (actionApp) {
    toastOptions.actions = [OPEN_BTN_LABEL];
    console.log(`[NOTIFICATION] Action button attached: "${OPEN_BTN_LABEL}" → will launch '${actionApp}'`);
  }

  console.log('[NOTIFICATION] Sending Windows toast...');

  notifier.notify(toastOptions, (err, response, metadata) => {
    if (err) {
      console.error('[NOTIFICATION] Windows toast error:', err);
      return;
    }
    console.log(`[NOTIFICATION] Toast response: "${response}", metadata: ${JSON.stringify(metadata)}`);

    // Match the stable button label we set above.
    // Also accept a dismissed/timeout gracefully.
    if (actionApp && response === OPEN_BTN_LABEL) {
      console.log(`[NOTIFICATION] User clicked "${OPEN_BTN_LABEL}" — forwarding launch request for '${actionApp}'`);
      if (mainWindow) {
        mainWindow.webContents.send('notification-action', actionApp);
      } else {
        console.warn('[NOTIFICATION] mainWindow is null — cannot forward notification-action');
      }
    } else if (response === 'timeout') {
      console.log('[NOTIFICATION] Toast timed out (user did not interact)');
    } else if (response === 'dismissed') {
      console.log('[NOTIFICATION] Toast dismissed by user');
    } else if (response) {
      console.log(`[NOTIFICATION] Unrecognised toast response: "${response}"`);
    }
  });

  console.log('[NOTIFICATION] Windows toast dispatched');
}

function createLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false
    }
  });
  
  loadingWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body style="background: #0a0e1a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif;">
        <h2>Starting Deep OS Backend...</h2>
      </body>
    </html>
  `);
  
  return loadingWindow;
}

async function checkBackendIsAlive() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${PORT}/api/system/status`, (res) => {
      if (res.statusCode === 200) resolve(true);
      else resolve(false);
    });
    req.on('error', () => resolve(false));
  });
}

async function startBackend() {
  console.log('Checking if backend is already running...');
  const isAlive = await checkBackendIsAlive();
  if (isAlive) {
    console.log('Backend is already running on port ' + PORT + '. Connecting to existing instance.');
    return;
  }

  return new Promise((resolve, reject) => {
    console.log('Starting Python backend...');
    
    let backendCmd = 'python';
    let backendArgs = ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', PORT.toString()];
    let cwd = path.join(__dirname, '..', 'backend');

    if (!isDev) {
      backendCmd = path.join(process.resourcesPath, 'backend', 'deepos-backend.exe');
      backendArgs = ['--host', '127.0.0.1', '--port', PORT.toString()];
      cwd = path.join(process.resourcesPath, 'backend');
    }

    try {
      const userDataPath = app.getPath('userData');
      const backendEnv = Object.assign({}, process.env, {
        DEEPOS_DATA_DIR: userDataPath
      });

      backendProcess = spawn(backendCmd, backendArgs, {
        cwd: cwd,
        windowsHide: true,
        env: backendEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`Backend stdout: ${data.toString()}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`Backend stderr: ${data.toString()}`);
      });

      backendProcess.on('error', (err) => {
        console.error('Failed to start backend process:', err);
        reject(err);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
        backendProcess = null;
      });

      // Wait for backend to be ready
      checkBackendReady(resolve, reject);
    } catch (err) {
      reject(err);
    }
  });
}

function checkBackendReady(resolve, reject, attempts = 0) {
  if (attempts > 60) { // 30 seconds max (60 * 500ms)
    reject(new Error('Backend failed to start in time.'));
    return;
  }

  const req = http.get(`http://127.0.0.1:${PORT}/api/system/status`, (res) => {
    if (res.statusCode === 200) {
      console.log('Backend is ready!');
      resolve();
    } else {
      setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 500);
    }
  });

  req.on('error', () => {
    setTimeout(() => checkBackendReady(resolve, reject, attempts + 1), 500);
  });
}

function killBackend() {
  if (backendProcess) {
    console.log('Killing backend process...');
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${backendProcess.pid} /t /f`, (err) => {
        if (err) {
          console.error(`Failed to kill process tree: ${err}`);
        } else {
          console.log('Backend process tree killed successfully.');
        }
      });
    } else {
      backendProcess.kill('SIGINT');
    }
    backendProcess = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    backgroundColor: '#0a0e1a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER === 'true') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const frontendPath = isDev 
      ? path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
      : path.join(__dirname, 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false);
  });
}

app.on('ready', async () => {
  const loadingWindow = createLoadingWindow();
  loadingWindow.show();

  try {
    await startBackend();
  } catch (err) {
    console.error('Error starting backend:', err);
    // Continue anyway for now or show error...
  }

  loadingWindow.close();
  
  await createWindow();
  
  // Set up IPC handles
  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow.close());
  ipcMain.handle('window-is-maximized', () => mainWindow.isMaximized());
  ipcMain.handle('app-get-version', () => app.getVersion());
  ipcMain.on('show-notification', (event, title, body, actionApp) => {
    console.log('[NOTIFICATION] IPC show-notification received');
    showWindowsToast({ title, message: body, actionApp });
  });

  // Dedicated handler for prediction/recommendation popups with actionApp
  ipcMain.on('show-prediction-notification', (event, { title, message, actionApp }) => {
    console.log('[NOTIFICATION] IPC show-prediction-notification received');
    showWindowsToast({ title, message, actionApp });
  });

  // Test notification — bypasses prediction engine, uses same notification stack
  ipcMain.on('test-notification', (event) => {
    console.log('[NOTIFICATION] IPC test-notification received');
    showWindowsToast({
      title: 'Deep OS — Test Notification',
      message: 'Notifications are working correctly.',
      actionApp: null,
      isTest: true
    });
  });

  // Set up Tray
  tray = createTray(mainWindow, () => {
    isQuitting = true;
    app.quit();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  killBackend();
});

app.on('window-all-closed', () => {
  // handled by tray logic, don't quit automatically unless isQuitting
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

module.exports = {
  quitApp: () => {
    isQuitting = true;
    app.quit();
  }
};
