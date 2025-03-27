const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid channels
const validChannels = [
  'start-tracking',
  'pause-tracking',
  'stop-tracking',
  'get-tracking-status',
  'get-session-log',
  'get-screenshots',
  'tracking-started',
  'tracking-paused',
  'tracking-stopped',
  'tracking-resumed',
  'screenshot-taken',
  'tracking-status',
  'session-log',
  'screenshots',
  'activity-update'
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      if (validChannels.includes(channel)) {
        // Strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
});
