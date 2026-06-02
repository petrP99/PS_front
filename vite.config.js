import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to BFF
      '/api': 'http://localhost:9090',
      '/oauth2': 'http://localhost:9090',
      '/login': 'http://localhost:9090',
      '/logout': 'http://localhost:9090'
    }
  }
})