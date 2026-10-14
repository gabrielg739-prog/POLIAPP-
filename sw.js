/* Service Worker PoliApp UNEXPO · Modo Offline Total */
const CACHE = 'poliapp-v5-pro-caterpillar';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/unexpo_logo_dual.png',
  'icons/unexpo_logo_dual_light.png',
  'icons/unexpo_logo_white.png',
  'icons/unexpo_logo_yellow.png',
  'pensums/pensums_index.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

const llave = (url) => {
  const u = new URL(url);
  return u.origin === location.origin ? u.origin + u.pathname : url;
};

const guardar = (key, res) => {
  if (res && (res.ok || res.type === 'opaque')) {
    const cp = res.clone();
    caches.open(CACHE).then((c) => c.put(key, cp)).catch(() => {});
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);

  // URLs externas (APIs de sync, etc.) van directo por red
  if (url.origin !== location.origin) {
    if (!['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return;
    e.respondWith(caches.match(r.url).then((m) => m || fetch(r).then((res) => guardar(r.url, res))));
    return;
  }

  const key = llave(r.url);
  if (r.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname)) {
    // Primero intenta red; si falla (offline), entrega la copia guardada al instante
    e.respondWith(
      fetch(r).then((res) => guardar(key, res)).catch(() => {
        return caches.match(key).then((m) => m || (r.mode === 'navigate' ? caches.match(llave(new URL('index.html', self.registration.scope).href)) : Response.error()));
      })
    );
  } else {
    // Activos estáticos: primero caché, luego red
    e.respondWith(
      caches.match(key).then((m) => m || fetch(r).then((res) => guardar(key, res)))
    );
  }
});
