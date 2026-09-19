import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4: no tailwind.config.js needed, just this plugin
  ],
  server: {
    // Proxy: during development, any request to /api goes to the FastAPI backend
    // This avoids CORS issues and means we never hardcode the backend URL
    // Analogy: it's like Nginx reverse proxy, but just for local dev
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
