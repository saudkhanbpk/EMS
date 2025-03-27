
const { spawn } = require('child_process');
const path = require('path');
const waitOn = require('wait-on');
const fs = require('fs');

// Create the dist-electron directory if it doesn't exist
const distElectronDir = path.join(__dirname, '../dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}

// Compile the Electron TypeScript files
console.log('Compiling Electron TypeScript files...');
require('child_process').execSync('tsc --project electron/tsconfig.json', { stdio: 'inherit' });

// Copy the preload.js file
const preloadSrc = path.join(__dirname, '../electron/preload.js');
const preloadDest = path.join(__dirname, '../dist-electron/preload.js');
fs.copyFileSync(preloadSrc, preloadDest);

// Start Vite dev server
const vite = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit',
});

console.log('Waiting for dev server to start...');
waitOn({ resources: ['http-get://localhost:8080'], timeout: 60000 })
  .then(() => {
    console.log('Dev server is running. Starting Electron...');
    const electron = spawn('npx', ['electron', '.'], {
      shell: true,
      stdio: 'inherit',
    });

    electron.on('close', (code) => {
      console.log(`Electron process exited with code ${code}`);
      vite.kill();
      process.exit(code);
    });
  })
  .catch((err) => {
    console.error('Error starting dev server:', err);
    vite.kill();
    process.exit(1);
  });

process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
