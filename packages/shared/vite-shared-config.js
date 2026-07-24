import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execSync } from 'node:child_process';
import protoGlobals from './vite-plugin-proto-globals.js';

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/* Shared Vite config for all ShieldTech apps. The vendored prototype files
   rely on the classic JSX runtime with a global `React` (set on window in
   globals.js before any prototype module loads). */
export function shieldViteConfig() {
  let buildId = 'dev';
  try { buildId = execSync('git rev-parse --short HEAD').toString().trim(); } catch {}
  return defineConfig({
    define: { __SHIELD_BUILD__: JSON.stringify(buildId + ' · ' + new Date().toISOString().slice(0, 16).replace('T', ' ')) },
    base: './', // relative asset paths so builds work under any host/sub-path
    publicDir: path.join(sharedDir, 'public'),
    build: {
      // Modern browsers only — smaller output, no legacy transpile bloat.
      target: 'es2020',
      reportCompressedSize: false, // faster builds; sizes still visible via gzip
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // Split the big, stable third-party libs into their own long-cached
          // chunks so they download in parallel and are reused across deploys
          // (app-code changes no longer bust the vendor cache). Heavy optional
          // libs (tensorflow, mermaid, leaflet) stay in separate chunks that the
          // browser only fetches when a surface that needs them is opened.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/[\\/]react(-dom)?[\\/]|[\\/]scheduler[\\/]/.test(id)) return 'react';
            if (id.includes('@supabase') || id.includes('@simplewebauthn')) return 'supabase';
            if (id.includes('@tensorflow')) return 'tf';
            if (/mermaid|katex|cytoscape|dagre|[\\/]d3|elkjs|khroma|robust-predicates/.test(id)) return 'mermaid';
            if (id.includes('leaflet')) return 'leaflet';
            return 'vendor';
          },
        },
      },
    },
    resolve: {
      alias: { '@shared': sharedDir },
    },
    plugins: [
      protoGlobals(),
      react({
        jsxRuntime: 'classic',
        babel: { compact: false },
      }),
    ],
    server: { host: true },
  });
}
