// vite.config.ts
import { defineConfig } from "file:///G:/TechCreator%20Projects/EMS/node_modules/vite/dist/node/index.js";
import react from "file:///G:/TechCreator%20Projects/EMS/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173
  },
  optimizeDeps: {
    // Exclude lucide-react from pre-bundling (only if necessary)
    exclude: ["lucide-react"],
    // Include date-fns-tz for pre-bundling (only if necessary)
    include: ["date-fns-tz"]
  },
  build: {
    // Optional: Configure the build output
    outDir: "dist",
    // Default output directory
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          react: ["react", "react-dom"],
          dateFns: ["date-fns", "date-fns-tz"]
          // Add other large dependencies here
        }
      }
    },
    chunkSizeWarningLimit: 1e3
    // Adjust chunk size warning limit (optional)
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJHOlxcXFxUZWNoQ3JlYXRvciBQcm9qZWN0c1xcXFxFTVNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkc6XFxcXFRlY2hDcmVhdG9yIFByb2plY3RzXFxcXEVNU1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRzovVGVjaENyZWF0b3IlMjBQcm9qZWN0cy9FTVMvdml0ZS5jb25maWcudHNcIjsvLyBpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuLy8gaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuXHJcbi8vIC8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbi8vIGV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbi8vICAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4vLyAgIG9wdGltaXplRGVwczoge1xyXG4vLyAgICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcclxuLy8gICAgIGluY2x1ZGU6IFsnZGF0ZS1mbnMtdHonXSxcclxuLy8gICB9LFxyXG4vLyB9KTtcclxuXHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgYmFzZTogJy4vJyxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDUxNzNcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgLy8gRXhjbHVkZSBsdWNpZGUtcmVhY3QgZnJvbSBwcmUtYnVuZGxpbmcgKG9ubHkgaWYgbmVjZXNzYXJ5KVxyXG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcclxuICAgIC8vIEluY2x1ZGUgZGF0ZS1mbnMtdHogZm9yIHByZS1idW5kbGluZyAob25seSBpZiBuZWNlc3NhcnkpXHJcbiAgICBpbmNsdWRlOiBbJ2RhdGUtZm5zLXR6J10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gT3B0aW9uYWw6IENvbmZpZ3VyZSB0aGUgYnVpbGQgb3V0cHV0XHJcbiAgICBvdXREaXI6ICdkaXN0JywgLy8gRGVmYXVsdCBvdXRwdXQgZGlyZWN0b3J5XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgLy8gU3BsaXQgdmVuZG9yIGNodW5rcyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgICAgICAgIHJlYWN0OiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxyXG4gICAgICAgICAgZGF0ZUZuczogWydkYXRlLWZucycsICdkYXRlLWZucy10eiddLFxyXG4gICAgICAgICAgLy8gQWRkIG90aGVyIGxhcmdlIGRlcGVuZGVuY2llcyBoZXJlXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsIC8vIEFkanVzdCBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgKG9wdGlvbmFsKVxyXG4gIH0sXHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFZQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxjQUFjO0FBQUE7QUFBQSxJQUVaLFNBQVMsQ0FBQyxjQUFjO0FBQUE7QUFBQSxJQUV4QixTQUFTLENBQUMsYUFBYTtBQUFBLEVBQ3pCO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixPQUFPLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDNUIsU0FBUyxDQUFDLFlBQVksYUFBYTtBQUFBO0FBQUEsUUFFckM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUE7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
