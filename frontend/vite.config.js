import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Mantiene las llamadas del navegador same-origin y evita CORS en puertos Vite alternativos.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:2323',
        changeOrigin: true,
      },
    },
  },
})
