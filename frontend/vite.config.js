import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put all node_modules into a separate vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          // You can add more custom chunk splitting here
        }
      }
    },
    // Optional: increase chunk size warning limit (default is 500 KB)
    chunkSizeWarningLimit: 1000, // in KB
  }
})
