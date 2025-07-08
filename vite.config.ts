// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ['lucide-react'],
//     include: ['date-fns-tz'],
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173
  },
  optimizeDeps: {
    // Exclude lucide-react from pre-bundling (only if necessary)
    exclude: ['lucide-react'],
    // Include date-fns-tz for pre-bundling (only if necessary)
    include: ['date-fns-tz'],
  },
  build: {
    // Optional: Configure the build output
    outDir: 'dist', // Default output directory
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          react: ['react', 'react-dom'],
          dateFns: ['date-fns', 'date-fns-tz'],
          // Add other large dependencies here
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Adjust chunk size warning limit (optional)
  },
});