import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'react-vendor'
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas-vendor'
            }
            if (id.includes('purify')) {
              return 'purify-vendor'
            }
            // fallback for all other node_modules
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000, // 1 MB
  }
})
