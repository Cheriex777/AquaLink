import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Replit's Preview proxy forwards requests through a dynamic hostname.
    // Allow that hostname while the workflow still binds to 0.0.0.0.
    allowedHosts: true,
  },
})
