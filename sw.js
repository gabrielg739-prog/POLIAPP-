/* Service Worker PoliApp UNEXPO · Cache Offline */
const CACHE = 'poliapp-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const llave = (url) => { const u = new URL(url); return u.origin === location.origin ? u.origin + u.pathname : url; };
const guardar = (key, res) => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(key, cp)).catch(() => {}); } return res; };
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;
  const key = llave(r.url);
  if (r.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname)) {
    e.respondWith(fetch(r).then((res) => guardar(key, res)).catch(() => caches.match(key).then((m) => m || (r.mode === 'navigate' ? caches.match(llave(new URL('index.html', self.registration.scope).href)) : Response.error()))));
  } else {
    e.respondWith(caches.match(key).then((m) => m || fetch(r).then((res) => guardar(key, res))));
  }
});
