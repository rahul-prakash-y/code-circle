import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/ - updated
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          const normalized = id.replace(/\\/g, '/');

          if (!normalized.includes('/node_modules/')) {
            return;
          }

          // Core React vendor chunk (React, React-DOM, React-Router)
          if (
            normalized.includes('/node_modules/react/') ||
            normalized.includes('/node_modules/react-dom/') ||
            normalized.includes('/node_modules/react-router/') ||
            normalized.includes('/node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }

          // Animation vendor chunk
          if (normalized.includes('/node_modules/framer-motion/')) {
            return 'motion-vendor';
          }

          // UI vendor chunk (HeroUI & Lucide icons)
          if (
            normalized.includes('/node_modules/@heroui/') ||
            normalized.includes('/node_modules/lucide-react/')
          ) {
            return 'ui-vendor';
          }

          // Heavy specialized vendors
          if (normalized.includes('/node_modules/xlsx/')) {
            return 'vendor-xlsx';
          }
          if (
            normalized.includes('/node_modules/@monaco-editor/') ||
            normalized.includes('/node_modules/monaco-editor/')
          ) {
            return 'vendor-monaco';
          }
          if (normalized.includes('/node_modules/recharts/')) {
            return 'vendor-recharts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
