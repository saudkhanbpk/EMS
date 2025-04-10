import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, powerMonitor, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import isDev from 'electron-is-dev';
import ElectronStore from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import screenshot from 'screenshot-desktop';

// Define the store schema and create the store
interface StoreSchema {
  sessions: Session[];
  settings: {
    screenshotInterval: [number, number]; // Min and max interval in minutes
    inactivityTimeout: number; // In milliseconds
  };
}

interface PauseRecord {
  pausedAt: string;
  resumedAt?: string;
  reason?: string;
}

interface Screenshot {
  id: string;
  timestamp: string;
  path: string;
}

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  pauseHistory?: PauseRecord[];
  totalDuration?: number; // in milliseconds
  screenshots: Screenshot[];
}

// Create a type-safe store instance
const store = new ElectronStore<StoreSchema>({
  defaults: {
    sessions: [],
    settings: {
      screenshotInterval: [5, 10], // 5-10 minutes
      inactivityTimeout: 15 * 60 * 1000 // 15 minutes in milliseconds
    }
  }
});

// App instance variables
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isTracking = false;
let isPaused = false;
let currentSession: Session | null = null;
let screenshotTimer: NodeJS.Timeout | null = null;
let inactivityTimer: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();
let appIcon: string;

// Create the screenshots directory
const userDataPath = app.getPath('userData');
const screenshotsDir = path.join(userDataPath, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Set up the app icon based on platform
if (process.platform === 'win32') {
  appIcon = path.join(__dirname, '../assets/icon.ico');
} else if (process.platform === 'darwin') {
  appIcon = path.join(__dirname, '../assets/icon.icns');
} else {
  appIcon = path.join(__dirname, '../assets/icon.png');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: appIcon
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Set up the tray icon
  createTray();
  
  // Prevent window from being closed
  mainWindow.on('close', (event) => {
    if (isTracking) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Check for activity
  trackUserActivity();
}

function createTray() {
  tray = new Tray(appIcon);

  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: isTracking ? (isPaused ? 'Resume Tracking' : 'Pause Tracking') : 'Start Tracking',
        click: () => {
          if (!isTracking) {
            startTracking();
          } else if (isPaused) {
            resumeTracking();
          } else {
            pauseTracking('User paused from tray');
          }
        }
      },
      {
        label: 'Stop Tracking',
        enabled: isTracking,
        click: () => stopTracking()
      },
      { type: 'separator' },
      {
        label: 'Show App',
        click: () => {
          mainWindow?.show();
        }
      },
      {
        label: 'Quit',
        click: () => {
          if (isTracking) {
            stopTracking();
          }
          app.quit();
        }
      }
    ]);

    tray?.setContextMenu(contextMenu);

    tray?.setToolTip(isTracking
      ? isPaused
        ? 'Time Tracker (Paused)'
        : 'Time Tracker (Active)'
      : 'Time Tracker (Inactive)');
  };

  tray.on('click', () => {
    mainWindow?.show();
  });

  updateContextMenu();

  // Update the context menu when tracking state changes
  ipcMain.on('tracking-started', updateContextMenu);
  ipcMain.on('tracking-paused', updateContextMenu);
  ipcMain.on('tracking-stopped', updateContextMenu);
}

function startTracking() {
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

  // Schedule random screenshots
  scheduleNextScreenshot();

  // Reset activity timer
  resetInactivityTimer();

  mainWindow?.webContents.send('tracking-started', {
    sessionId,
    startTime
  });
}

function pauseTracking(reason = 'Unknown reason') {
  if (!isTracking || isPaused || !currentSession) return;

  isPaused = true;

  // Cancel pending screenshots
  if (screenshotTimer) {
    clearTimeout(screenshotTimer);
    screenshotTimer = null;
  }

  // Save pause record
  if (!currentSession.pauseHistory) {
    currentSession.pauseHistory = [];
  }

  currentSession.pauseHistory.push({
    pausedAt: new Date().toISOString(),
    reason
  });

  mainWindow?.webContents.send('tracking-paused');
}

function resumeTracking() {
  if (!isTracking || !isPaused || !currentSession) return;

  isPaused = false;

  // Update the last pause record with resume time
  if (currentSession.pauseHistory && currentSession.pauseHistory.length > 0) {
    const lastPause = currentSession.pauseHistory[currentSession.pauseHistory.length - 1];
    lastPause.resumedAt = new Date().toISOString();
  }

  // Resume screenshot schedule
  scheduleNextScreenshot();

  // Reset inactivity timer
  resetInactivityTimer();

  mainWindow?.webContents.send('tracking-started', {
    sessionId: currentSession.id,
    startTime: currentSession.startTime
  });
}

function stopTracking() {
  if (!isTracking || !currentSession) return;

  // Cancel timers
  if (screenshotTimer) {
    clearTimeout(screenshotTimer);
    screenshotTimer = null;
  }

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  // Update session end time
  currentSession.endTime = new Date().toISOString();

  // Calculate total duration (accounting for pauses)
  let totalDuration = new Date(currentSession.endTime).getTime() -
    new Date(currentSession.startTime).getTime();

  if (currentSession.pauseHistory && currentSession.pauseHistory.length > 0) {
    let pauseDuration = 0;

    currentSession.pauseHistory.forEach(pause => {
      const pauseStart = new Date(pause.pausedAt).getTime();
      const pauseEnd = pause.resumedAt
        ? new Date(pause.resumedAt).getTime()
        : new Date(currentSession.endTime!).getTime();

      pauseDuration += pauseEnd - pauseStart;
    });

    totalDuration -= pauseDuration;
  }

  currentSession.totalDuration = totalDuration;

  // Save completed session
  const sessions = getSessions();
  sessions.push(currentSession);
  setSessions(sessions);

  // Reset state
  isTracking = false;
  isPaused = false;

  mainWindow?.webContents.send('tracking-stopped');

  currentSession = null;
}

async function captureScreenshot() {
  if (!isTracking || isPaused || !currentSession) return;

  try {
    const displays = screen.getAllDisplays();
    const primaryDisplay = displays.find(d => d.bounds.x === 0 && d.bounds.y === 0) || displays[0];

    const timestamp = new Date().toISOString();
    const filename = `screenshot-${currentSession.id}-${Date.now()}.png`;
    const filePath = path.join(screenshotsDir, filename);

    // Take screenshot of the primary display
    const img = await screenshot({ screen: 0 });
    fs.writeFileSync(filePath, img);

    // Create screenshot record
    const screenshotRecord: Screenshot = {
      id: uuidv4(),
      timestamp,
      path: filePath
    };

    // Save to current session
    currentSession.screenshots.push(screenshotRecord);

    // Send to renderer
    const dataUrl = `data:image/png;base64,${img.toString('base64')}`;

    mainWindow?.webContents.send('screenshot-taken', {
      ...screenshotRecord,
      data: dataUrl
    });

    // Schedule next screenshot
    scheduleNextScreenshot();
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    // Schedule next screenshot despite error
    scheduleNextScreenshot();
  }
}

function scheduleNextScreenshot() {
  if (screenshotTimer) {
    clearTimeout(screenshotTimer);
  }

  if (!isTracking || isPaused) return;

  const [minMinutes, maxMinutes] = getScreenshotInterval();
  const minMs = minMinutes * 60 * 1000;
  const maxMs = maxMinutes * 60 * 1000;
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

  screenshotTimer = setTimeout(captureScreenshot, delay);
}

function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  if (!isTracking || isPaused) return;

  lastActivityTime = Date.now();

  const inactivityTimeout = getInactivityTimeout();
  inactivityTimer = setTimeout(checkActivity, 60000); // Check every minute
}

function checkActivity() {
  if (!isTracking || isPaused) return;

  const now = Date.now();
  const inactivityDuration = now - lastActivityTime;
  const inactivityTimeout = getInactivityTimeout();

  if (inactivityDuration >= inactivityTimeout) {
    pauseTracking('Inactivity timeout');
  } else {
    // Schedule next check
    inactivityTimer = setTimeout(checkActivity, 60000);
  }
}

function trackUserActivity() {
  // Track keyboard and mouse activity
  powerMonitor.on('user-did-become-active', () => {
    if (isTracking && isPaused) {
      // Auto-resume when user returns after auto-pause
      const autoResumeAfterInactivity = true; // Could be a setting
      if (autoResumeAfterInactivity) {
        resumeTracking();
      }
    }

    lastActivityTime = Date.now();
  });
}

// IPC handlers
ipcMain.on('start-tracking', () => {
  startTracking();
});

ipcMain.on('pause-tracking', () => {
  pauseTracking('User paused');
});

ipcMain.on('stop-tracking', () => {
  stopTracking();
});

ipcMain.on('get-tracking-status', (event) => {
  event.sender.send('tracking-status', {
    isTracking,
    isPaused,
    currentSession
  });
});

ipcMain.on('get-session-log', (event) => {
  const sessions = getSessions();
  event.sender.send('session-log', sessions);
});

ipcMain.on('get-screenshots', (event, sessionId) => {
  let sessionScreenshots: Screenshot[] = [];

  if (currentSession && currentSession.id === sessionId) {
    sessionScreenshots = currentSession.screenshots;
  } else {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      sessionScreenshots = session.screenshots;
    }
  }

  // Add data URLs for screenshots
  const screenshotsWithData = sessionScreenshots.map(screenshot => {
    try {
      const data = fs.readFileSync(screenshot.path);
      return {
        ...screenshot,
        data: `data:image/png;base64,${data.toString('base64')}`
      };
    } catch (err) {
      console.error(`Failed to read screenshot file: ${screenshot.path}`, err);
      return screenshot;
    }
  });

  event.sender.send('screenshots', screenshotsWithData);
});

// App lifecycle events
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
    stopTracking();
  }

  globalShortcut.unregisterAll();
});

function getSessions(): Session[] {
  return store.get('sessions') ?? [];
}

function setSessions(sessions: Session[]) {
  store.set('sessions', sessions);
}

function getScreenshotInterval(): [number, number] {
  const settings = store.get('settings');
  return settings.screenshotInterval;
}

function getInactivityTimeout(): number {
  const settings = store.get('settings');
  return settings.inactivityTimeout;
}
