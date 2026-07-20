import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import protoGlobals from './vite-plugin-proto-globals.js';

// The vendored prototype files rely on the classic JSX runtime with a global
// `React` (set on window in src/globals.js before any prototype module loads).
export default defineConfig({
  plugins: [
    protoGlobals(),
    react({
      jsxRuntime: 'classic',
      babel: { compact: false },
    }),
  ],
  server: {
    host: true,
  },
});
