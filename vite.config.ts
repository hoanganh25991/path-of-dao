import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

/** GitHub Pages project site: hoanganh25991.github.io/path-of-dao */
const BASE_PATH = '/path-of-dao/';

const pwaManifest = {
  name: 'Path of Dao',
  short_name: 'PathOfDao',
  description: 'Cultivation action RPG — explore maps, grow your realm, return to your Home shrine.',
  id: BASE_PATH,
  start_url: BASE_PATH,
  scope: BASE_PATH,
  display: 'standalone' as const,
  orientation: 'landscape' as const,
  background_color: '#0a0a12',
  theme_color: '#0a0a12',
  icons: [
    {
      src: `${BASE_PATH}icons/icon-192.png`,
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: `${BASE_PATH}icons/icon-512.png`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: `${BASE_PATH}icons/icon-512.png`,
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export default defineConfig({
  base: BASE_PATH,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    /** GitHub Pages serves /docs on the default branch. */
    outDir: 'docs',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: pwaManifest,
      devOptions: {
        enabled: true,
      },
      workbox: {
        sourcemap: false,
        globPatterns: ['**/*.{js,css,html,ico,png,json,woff2}'],
        navigateFallback: `${BASE_PATH}index.html`,
      },
    }),
  ],
});
