
const { execSync } = require('child_process');

// First build the app
execSync('node scripts/electron-build.js', { stdio: 'inherit' });

// Then build the installer
execSync('node electron/electron-builder.js', { stdio: 'inherit' });

console.log('Package build completed!');
