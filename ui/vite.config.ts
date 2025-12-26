import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Proxy para API do Nexcrate (crates)
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy para API do Suri (admin panel)
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/clients': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
