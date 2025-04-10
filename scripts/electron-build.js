
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Build the React app
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// Create the dist-electron directory if it doesn't exist
const distElectronDir = path.join(__dirname, '../dist-electron');
if (!fs.existsSync(distElectronDir)) {
  fs.mkdirSync(distElectronDir, { recursive: true });
}

// Compile the Electron TypeScript files
console.log('Compiling Electron TypeScript files...');
execSync('tsc --project electron/tsconfig.json', { stdio: 'inherit' });

// Copy the preload.js file
const preloadSrc = path.join(__dirname, '../electron/preload.js');
const preloadDest = path.join(__dirname, '../dist-electron/preload.js');
fs.copyFileSync(preloadSrc, preloadDest);

console.log('Electron build completed!');
