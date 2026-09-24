import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * `npm run dev` (Vite) ne sait pas exécuter les fonctions serveur sous
 * api/*.ts (cf. src/features/payment/README.md) — /api/launch-offer-count
 * répond donc 404 en local, et la carte "Offre de lancement" ne s'affiche
 * jamais tant que le projet n'est pas déployé sur Vercel. Ce middleware ne
 * sert QUE pendant `vite dev` (jamais `vite build`, jamais Vercel) et
 * renvoie une valeur factice pour pouvoir prévisualiser cette carte en
 * local. Aucun impact sur api/launch-offer-count.ts ni sur le comportement
 * réel en production.
 */
function mockLaunchOfferCountInDev(): Plugin {
  return {
    name: 'mock-launch-offer-count-dev-only',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/launch-offer-count', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ limit: 100, redeemed: 63, remaining: 37, available: true }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mockLaunchOfferCountInDev(),
    // Diagnostic only : hook Rollup's generateBundle, donc ne s'exécute que
    // lors de `vite build` (jamais en dev) et n'altère pas le bundle produit —
    // écrit uniquement un rapport HTML séparé pour inspection manuelle.
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
