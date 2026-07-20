import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import protoGlobals from './vite-plugin-proto-globals.js';

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/* Shared Vite config for all ShieldTech apps. The vendored prototype files
   rely on the classic JSX runtime with a global `React` (set on window in
   globals.js before any prototype module loads). */
export function shieldViteConfig() {
  return defineConfig({
    base: './', // relative asset paths so builds work under any host/sub-path
    publicDir: path.join(sharedDir, 'public'),
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
