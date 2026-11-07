import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Lista del build para que el Service Worker lo guarde entero al instalarse. */
function listaPrecache(): Plugin {
  return {
    name: 'mirroria-precache',
    apply: 'build',
    generateBundle(_opciones, bundle) {
      const rutas = Object.keys(bundle).filter((f) => /\.(js|css|woff2?|svg|png|webp)$/.test(f)).map((f) => `/${f}`)
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(rutas) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), listaPrecache()],
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
