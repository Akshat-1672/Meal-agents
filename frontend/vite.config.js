import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Points to your FastAPI
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