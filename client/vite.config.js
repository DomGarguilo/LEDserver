import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PROXY_TARGET = process.env.VITE_API_PROXY ?? 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      '@': path.resolve(__dirname, 'src'),
      utils: path.resolve(__dirname, 'src/utils.js')
    }
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/data': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      },
      '/metadata': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      },
      '/catalog': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      },
      '/frameData': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      },
      '/framesRaw': {
        target: API_PROXY_TARGET,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: Number(process.env.PORT) || 4173
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/testing/setupTests.js',
    globals: true,
    server: {
      host: '127.0.0.1'
    }
  }
});
