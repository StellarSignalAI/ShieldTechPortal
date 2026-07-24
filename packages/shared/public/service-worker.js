/* ShieldTech service worker — makes the installed apps load fast and work
   offline. Strategy:
     • Navigations: network-first (always get fresh HTML when online, which
       pulls the latest hashed asset URLs), fall back to the cached shell when
       offline so the app still boots.
     • Static assets (Vite emits content-hashed, immutable filenames under
       /assets/, plus fonts/images): cache-first — instant on repeat loads.
     • Everything else (Supabase, APIs, cross-origin): passthrough, never cached.
   One shared file is served at each app's origin root, so its scope is that
   single app origin. Bump CACHE_VERSION to force clients onto a fresh cache. */
const CACHE_VERSION = 'shieldtech-v1';
const SHELL_URL = './index.html';

self.addEventListener('install', (event) => {
  // Pre-cache the app shell so the very first offline load has something.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.add(SHELL_URL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico|json|webmanifest)$/i.test(url.pathname)
    || url.pathname.includes('/assets/');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only handle same-origin requests. Supabase, OpenAI, tiles, etc. pass through.
  if (url.origin !== self.location.origin) return;

  // App navigations: network-first with cached-shell fallback (offline boot).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL_URL).then((r) => r || caches.match(req)))
    );
    return;
  }

  // Static, content-hashed assets: cache-first, then populate cache.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
      )
    );
  }
});
