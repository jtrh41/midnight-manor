// Midnight at the Manor offline helper. VERSION changes with every build so updates arrive on their own.
const VERSION = 'mm-b311235864d0';
const CORE = ['./', 'index.html', 'app.js', 'live.js', 'engine.js', 'themes.js', 'vendor/qrcode-gen.js', 'style.css', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mm-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]); }
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  // network first (so updates land), saved copy when offline
  e.respondWith(withTimeout(fetch(req, { cache: 'no-store' }), 4000)
    .then(res => { if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || c.match('index.html')))));
});
