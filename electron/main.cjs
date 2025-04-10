const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { v4: uuidv4 } = require('uuid');
const screenshot = require('screenshot-desktop');
const fs = require('fs');

// Import electron-store using import()
let store;
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store({
    name: 'focus-snapper-store',
    defaults: {
      sessions: [],
      settings: {
        screenshotInterval: [5, 10], // 5-10 minutes
        inactivityTimeout: 15 * 60 * 1000, // 15 minutes in milliseconds
        activityThreshold: 5 * 60 * 1000 // 5 minutes of inactivity threshold
      }
    }
  });
})();

let mainWindow;
let tray;
let isTracking = false;
let isPaused = false;
let currentSession = null;
let screenshotTimer = null;

// Get the absolute path to the project root
const projectRoot = path.resolve(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'assets', 'screenshots');

// Ensure the screenshots directory exists
try {
  if (!fs.existsSync(path.join(projectRoot, 'assets'))) {
    fs.mkdirSync(path.join(projectRoot, 'assets'));
  }
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
} catch (error) {
  console.error('Error creating directories:', error);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupIPCHandlers();
}

function setupIPCHandlers() {
  // Start tracking
  ipcMain.on('start-tracking', () => {
    if (isTracking) return;

    const sessionId = uuidv4();
    const startTime = new Date().toISOString();

    currentSession = {
      id: sessionId,
      startTime,
      screenshots: []
    };

    isTracking = true;
    isPaused = false;

    // Start taking screenshots
    scheduleNextScreenshot();

    mainWindow.webContents.send('tracking-started', {
      sessionId,
      startTime
    });
  });

  // Pause tracking
  ipcMain.on('pause-tracking', () => {
    if (!isTracking || isPaused || !currentSession) return;

    isPaused = true;
    if (screenshotTimer) {
      clearTimeout(screenshotTimer);
      screenshotTimer = null;
    }

    if (!currentSession.pauseHistory) {
      currentSession.pauseHistory = [];
    }

    currentSession.pauseHistory.push({
      pausedAt: new Date().toISOString()
    });

    mainWindow.webContents.send('tracking-paused');
  });

  // Stop tracking
  ipcMain.on('stop-tracking', () => {
    if (!isTracking || !currentSession) return;

    if (screenshotTimer) {
      clearTimeout(screenshotTimer);
      screenshotTimer = null;
    }

    currentSession.endTime = new Date().toISOString();

    // Save session
    const sessions = store.get('sessions', []);
    sessions.push(currentSession);
    store.set('sessions', sessions);

    isTracking = false;
    isPaused = false;

    mainWindow.webContents.send('tracking-stopped');
    currentSession = null;
  });

  // Get tracking status
  ipcMain.on('get-tracking-status', () => {
    mainWindow.webContents.send('tracking-status', {
      isTracking,
      isPaused,
      currentSession
    });
  });

  // Get session log
  ipcMain.on('get-session-log', () => {
    const sessions = store.get('sessions', []);
    mainWindow.webContents.send('session-log', sessions);
  });

  // Get screenshots for a session
  ipcMain.on('get-screenshots', (event, sessionId) => {
    const sessions = store.get('sessions', []);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      mainWindow.webContents.send('screenshots', session.screenshots);
    }
  });

  // Handle activity updates
  ipcMain.on('activity-update', (event, activityData) => {
    if (!isTracking || !currentSession) return;

    const settings = store.get('settings');
    const inactivityThreshold = settings.activityThreshold;

    // Update session with activity data
    if (!currentSession.activityHistory) {
      currentSession.activityHistory = [];
    }

    currentSession.activityHistory.push({
      timestamp: new Date().toISOString(),
      ...activityData
    });

    // Check for inactivity
    const timeSinceLastActivity = Date.now() - new Date(activityData.lastActivityTime).getTime();
    if (timeSinceLastActivity > inactivityThreshold) {
      if (!isPaused) {
        isPaused = true;
        if (screenshotTimer) {
          clearTimeout(screenshotTimer);
          screenshotTimer = null;
        }
        mainWindow.webContents.send('tracking-paused');
      }
    } else if (isPaused) {
      isPaused = false;
      scheduleNextScreenshot();
      mainWindow.webContents.send('tracking-resumed');
    }
  });
}

function scheduleNextScreenshot() {
  if (!isTracking || isPaused) return;

  const settings = store.get('settings');
  const [minMinutes, maxMinutes] = settings.screenshotInterval;
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  const delay = Math.random() * (maxMs - minMs) + minMs;

  screenshotTimer = setTimeout(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `${timestamp}-${uuidv4()}.png`;
      const filepath = path.join(screenshotsDir, filename);

      // Ensure the directory exists before taking screenshot
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      console.log('Taking screenshot, saving to:', filepath);
      await screenshot({ filename: filepath });

      if (currentSession) {
        const relativePath = path.join('assets', 'screenshots', filename).replace(/\\/g, '/');
        currentSession.screenshots.push({
          id: uuidv4(),
          timestamp,
          path: relativePath
        });

        mainWindow.webContents.send('screenshot-taken', {
          timestamp,
          path: relativePath
        });
      }

      scheduleNextScreenshot();
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      console.error('Error details:', error.message);
      scheduleNextScreenshot();
    }
  }, delay);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (isTracking) {
    // Save the current session before quitting
    const sessions = store.get('sessions', []);
    if (currentSession) {
      currentSession.endTime = new Date().toISOString();
      sessions.push(currentSession);
      store.set('sessions', sessions);
    }
  }
});