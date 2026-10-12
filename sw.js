/* Service Worker – מחולל ברכות
   תמיד מנסה להביא מהרשת את הגרסה העדכנית (כך שכולם מתעדכנים מיד),
   ושומר עותק כדי שהמערכת תעבוד גם בלי אינטרנט. */
const CACHE = 'brachot-cache-v1';
const CORE = ['./', 'index.html', 'library.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {cache: 'no-cache'})).catch(() => null)))));
});
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('version.json')) return;           // תמיד מהרשת
  e.respondWith((async () => {
    try {
      const res = await fetch(req, {cache: 'no-cache'});
      if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const c = await caches.open(CACHE);
      return (await c.match(req, {ignoreSearch: true})) || (req.mode === 'navigate' ? (await c.match('index.html')) || (await c.match('./')) : Response.error());
    }
  })());
});
