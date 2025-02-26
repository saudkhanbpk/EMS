import { app, BrowserWindow } from 'electron';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';
var require = createRequire(import.meta.url);
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
var mainWindow;
app.whenReady().then(function () {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'), // Use a preload script for security
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173'); // Load Vite dev server
    }
    else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')); // Load production build
    }
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
