import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const bffProxyTarget = process.env.VITE_BFF_PROXY_TARGET || 'http://localhost:9091'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to BFF
      '/api': bffProxyTarget,
      '/ws': {
        target: bffProxyTarget,
        ws: true
      },
      '/oauth2': bffProxyTarget,
      '/login': bffProxyTarget,
      '/logout': bffProxyTarget
    }
  }
})

