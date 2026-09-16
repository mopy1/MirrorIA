import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Fijo a propósito: coincide con CORS_ORIGINS en mirroria-backend/.env.example.
    // Si se cambia acá, hay que cambiarlo también ahí (ver AGENTS.md).
    port: 5174,
  },
})
