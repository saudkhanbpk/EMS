
const builder = require('electron-builder');
const path = require('path');

builder.build({
  config: {
    appId: 'com.lovable.timetracker',
    productName: 'Time Tracker',
    copyright: 'Copyright © 2023',
    directories: {
      output: 'release',
    },
    files: [
      'dist/**/*',
      'dist-electron/**/*',
      'electron.js',
      '!**/node_modules/**/*',
    ],
    mac: {
      category: 'public.app-category.productivity',
      target: ['dmg', 'zip'],
    },
    win: {
      target: ['nsis', 'portable'],
    },
    linux: {
      target: ['AppImage', 'deb'],
      category: 'Utility',
    },
  },
});
