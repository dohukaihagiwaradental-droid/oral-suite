/* Service Worker: オフライン動作用（統合アプリのシェルをキャッシュ） */
const CACHE = 'oralsuite-v6';
const ASSETS = [
  './',
  './index.html',
  './dev.html',
  './manifest-dev.json',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* 画面(HTML)はネット優先：更新がすぐ届く。圏外のときだけ保存済みを使う */
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if (isPage) {
    e.respondWith(
      fetch(req, {cache: 'no-store'}).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./dev.html') || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
