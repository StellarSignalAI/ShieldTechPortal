# ShieldTech Portal

Production frontend port of the ShieldTech Solutions desktop operations portal, implemented at pixel parity from the claude.ai/design project **"portal"**. The prototype is the spec: every screen module and every design-system CSS file is vendored verbatim; only mechanical module-semantics shims (window-global exposure) were added so the code runs as real ES modules under Vite instead of Babel-in-browser.

## Run

```bash
npm install
npm run dev        # dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
```

The app boots to the login screen. Navigate with the sidebar, the command palette, or the Tweaks panel (bottom-right gear) — every screen is also deep-linkable via URL hash, e.g. `#/dashboard`, `#/crm`, `#/finance`.

## Architecture

- **`src/proto/`** — the ~90 prototype JSX modules, vendored verbatim in the exact `<script>` load order of the original `ShieldTech Portal.html`. Each attaches its components to `window` (`Object.assign(window, {...})`), preserving the prototype's cross-file global contract.
- **`src/proto-manifest.js`** — single import list replicating the shell's load order (shared runtime → widgets → screens → bid board → survey → tweaks).
- **`vite-plugin-proto-globals.js`** — for `src/proto/*.jsx`, exposes each top-level declaration on `window` so bare-identifier cross-file references resolve exactly as they did under Babel-in-browser.
- **`src/main.jsx`** — the ported App shell: screen map (68 screens), tweaks wiring, toast host, `anim-ready` gate, `window.__shieldNav`.
- **`src/styles/`** — design tokens and global CSS, vendored verbatim (dark SOC aesthetic, electric-blue `#3FA9F5`, glass panels; Montserrat / IBM Plex Sans / JetBrains Mono self-hosted via @fontsource).
- **State** is the prototype's simulated layer: localStorage-backed stores with seed data (`shared-state.jsx`). No backend required; the app boots looking exactly like the prototype.

## Verification

`scripts/drive-screens.mjs` drives every screen in `SCREEN_LIST` through `window.__shieldNav` with Playwright, screenshots each, and fails on blank renders or console errors:

```bash
npm run build && npm run preview -- --port 4173 &
SCREEN_JSON=<path-to-screen-list.json> node scripts/drive-screens.mjs
```

Latest run: **68/68 screens rendered, 0 blank, 0 runtime errors.**

## Screen inventory

See [INVENTORY.md](INVENTORY.md) for the full checklist of all 68 wired screens.

## Known gaps

- `sw/shieldtech-emblem.png` (and its duplicate under `uploads/`) exceeds the design-sync 256 KiB file-read cap and could not be exported intact; the Secret Weapon `ShieldMark` component falls back to alt text. Drop the original PNG into `public/sw/shieldtech-emblem.png` to restore it.
- Other surfaces from the design project (Mobile, Technician, Customer portal, standalone Secret Weapon app) are follow-up passes using the same vendoring pattern.
