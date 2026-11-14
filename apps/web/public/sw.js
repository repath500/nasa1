/* Fire Atlas offline cache. Cached after first load: app shell, built assets, corpus, fonts and preset audio. Never caches /api. */
const VERSION = 'fa-v1';
const SHELL = ['/', '/index.html'];
const RUNTIME = /^\/(assets\/|fonts\/|data\/|audio\/)/;

self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function rangeFromCache(req, res) {
  const range = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || '');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const start = Number(range[1]); const end = range[2] ? Number(range[2]) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('/', copy)); return r; }).catch(() => caches.match('/').then((r) => r || caches.match('/index.html'))));
    return;
  }
  if (!RUNTIME.test(url.pathname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const key = url.pathname + url.search;
    const hit = await cache.match(key);
    const isData = url.pathname.startsWith('/data/') || url.pathname.startsWith('/audio/') && url.pathname.endsWith('.json');
    const refresh = fetch(new Request(url.href)).then((r) => { if (r.ok) cache.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { if (isData) e.waitUntil(refresh); return req.headers.has('range') ? rangeFromCache(req, hit) : hit; }
    const net = await refresh;
    if (net) return req.headers.has('range') ? rangeFromCache(req, net.clone()) : net;
    return new Response('Offline', { status: 503 });
  })());
});
