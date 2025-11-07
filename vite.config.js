import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Three.js into its own chunk
          'three-vendor': ['three'],
          // Separate Recharts into its own chunk
          'recharts-vendor': ['recharts'],
          // Separate Tone.js into its own chunk
          'tone-vendor': ['tone'],
          // Group other large dependencies
          'vendor': ['react', 'react-dom']
        }
      }
    },
    // Increase chunk size warning limit since we're intentionally chunking
    chunkSizeWarningLimit: 1000
  }
})
