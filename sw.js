/* ============================================================================
   ARBORIST ASSISTANT — SERVICE WORKER

   This is what makes the app work with no connectivity. It is NOT what makes it
   installable — the manifest does that. Registering this file is enough to get a
   fully offline web app in an ordinary browser tab.

   Strategy: stale-while-revalidate for the app shell. A cached response is served
   immediately (instant launch, works with the radio off) while a fresh copy is
   fetched in the background for next time. Field use should never wait on a
   network round trip that may not complete.

   CACHE_VERSION is rewritten by deploy.sh to a hash of the app HTML, so the cache
   invalidates exactly when the app changes and never on a no-op. The literal below
   is only what a hand-copied deployment would use — if you publish by hand, bump it
   yourself, or stale builds will keep being served.
   ========================================================================== */

const CACHE_VERSION = 'v-94f9791d84';
const CACHE_NAME = 'arborist-shell-' + CACHE_VERSION;

/* Relative paths so the app works from any host and any subdirectory
   (e.g. a GitHub Pages project site served under /repo-name/). */
const SHELL = [
  './',
  './tree_plot_plan_editor.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/icon-32.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    /* Add individually: one missing optional file must not fail the whole install,
       which is what cache.addAll() would do. */
    await Promise.all(SHELL.map(async url => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      } catch (err) {
        console.warn('[sw] could not precache', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter(n => n.startsWith('arborist-shell-') && n !== CACHE_NAME)
           .map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  /* Only same-origin GETs. Everything else (there is nothing else — the app makes
     no external requests) passes straight through. */
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req, { ignoreSearch: true });

    const network = fetch(req).then(async res => {
      if (res && res.ok && res.type === 'basic') {
        /* If the page itself changed, tell the open tabs so they can offer a reload.
           Without this, an HTML-only deploy would go unnoticed: sw.js is unchanged,
           so no 'updatefound' fires, and stale-while-revalidate would keep serving
           the old build until the user happened to load twice. */
        if (req.mode === 'navigate' && cached) {
          try {
            const [was, now] = await Promise.all([cached.clone().text(), res.clone().text()]);
            if (was !== now) {
              const clients = await self.clients.matchAll({ type: 'window' });
              clients.forEach(c => c.postMessage({ type: 'content-updated' }));
            }
          } catch (err) { /* comparison is best-effort */ }
        }
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(network);          // refresh in the background
      return cached;
    }

    const fresh = await network;
    if (fresh) return fresh;

    /* Offline with nothing cached for this exact URL: for a page load, fall back to
       the app shell so a bookmark with a stray query string still opens. */
    if (req.mode === 'navigate') {
      const shell = await cache.match('./tree_plot_plan_editor.html');
      if (shell) return shell;
    }
    return new Response('Offline and not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  })());
});

/* Lets the page trigger an immediate update instead of waiting for a restart. */
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
