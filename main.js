"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url_1 = require("url");
var path_1 = require("path");
// Fix for __dirname not being available in ES modules
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
// Fix for NODE_ENV being undefined
var isDev = (process.env.NODE_ENV || 'production') === 'development' || !electron_1.app.isPackaged;
var mainWindow;
electron_1.app.whenReady().then(function () {
    mainWindow = new electron_1.BrowserWindow({
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
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
