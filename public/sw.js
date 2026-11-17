// Service worker: lets the app be installed, and shows /offline.html when a page cannot load without a connection.
// It does NOT cache app pages or data: those are personal and change all the time, so they always come from the server.
const CACHE = 'lf-shell-v1';
const SHELL = ['/offline.html', '/icon.svg', '/icon-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  // Remove caches from older versions of this file.
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Page loads: try the network; if there is no connection, show the offline page.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }
  // The few files the offline page itself needs.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  }
});
