// Simple PWA service worker for GitHub Pages
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Add here the core files of your site you want available offline
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/script.js',
  './img/logo_actuel.png',
  './manifest.json'
];

// A tiny offline fallback page (kept inline to avoid extra file)
const OFFLINE_HTML = `<!doctype html>
<html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors connexion • Bricks Creations</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;margin:0;display:grid;place-items:center;height:100vh;padding:24px;background:#f8fafc;color:#0f172a}main{max-width:560px;text-align:center;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:28px}h1{font-size:1.25rem;margin:0 0 .5rem}p{line-height:1.6;margin:.25rem 0}.muted{opacity:.75}</style>
<main>
  <h1>Vous êtes hors connexion</h1>
  <p>Cette page n'a pas pu être chargée depuis le réseau.</p>
  <p class="muted">Essayez de revenir en arrière ou vérifiez votre connexion internet.</p>
</main>
</html>`;

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        if (key !== STATIC_CACHE) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Helper: is navigation request?
function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Fetch strategy:
// - HTML (navigations): network-first, fallback to cache, then inline offline page
// - Other assets: cache-first, then network
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (isNavigationRequest(req)) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(req);
          // Optionally: put a fresh copy in cache
          const cache = await caches.open(STATIC_CACHE);
          cache.put(req, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(req);
          return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // Put a copy in cache for next time
      const copy = res.clone();
      caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});