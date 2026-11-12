// Service worker mínimo para que la web sea instalable.
// Red primero (así siempre recibes la última versión) y caché solo como respaldo.
// Nunca toca las peticiones a Spotify: solo archivos de esta misma web.
const CACHE = 'hitster-v1';
const SHELL = ['./', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE)
            .then(c => c.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // Spotify, fuentes, jsQR: directo a la red

    // Clave sin parámetros (?id=…, ?code=…) para no llenar la caché de variantes
    const key = url.origin + url.pathname;

    e.respondWith(
        fetch(req)
            .then(res => {
                if (res.ok) {
                    const copia = res.clone();
                    caches.open(CACHE).then(c => c.put(key, copia));
                }
                return res;
            })
            .catch(() => caches.match(key).then(m => m || caches.match('./')))
    );
});
