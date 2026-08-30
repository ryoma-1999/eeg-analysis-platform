import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',

    allowedHosts: [
      'ca-eeg-frontend.victoriousocean-5b02e89c.japaneast.azurecontainerapps.io',
    ],

    proxy: {
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },

    watch: {
      usePolling: true,
    },
  },
})