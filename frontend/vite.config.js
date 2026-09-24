import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // Points to your Next.js backend
        changeOrigin: true,
      }
    }
  },
  build: {
    // Output directly to your Python static folder!
    outDir: '../src/static',
    emptyOutDir: true, 
  }
})