/* Service worker «Гримуара». Список файлов подставляется при сборке.
   Записи сюда не попадают — они лежат в IndexedDB, этот кэш только для самого приложения. */
const VERSION = '2b29711836';
const CACHE = 'grimoire-' + VERSION;
const PRECACHE = ["./","./assets/index-DF7QH_V5.js","./assets/index-O9P-N9-N.css","./assets/inter-cyrillic-400-normal-HOLc17fK.woff","./assets/inter-cyrillic-400-normal-obahsSVq.woff2","./assets/inter-cyrillic-500-normal-BasfLYem.woff2","./assets/inter-cyrillic-500-normal-CxZf_p3X.woff","./assets/inter-cyrillic-600-normal-4D_pXhcN.woff","./assets/inter-cyrillic-600-normal-CWCymEST.woff2","./assets/inter-latin-400-normal-C38fXH4l.woff2","./assets/inter-latin-400-normal-CyCys3Eg.woff","./assets/inter-latin-500-normal-BL9OpVg8.woff","./assets/inter-latin-500-normal-Cerq10X2.woff2","./assets/inter-latin-600-normal-CiBQ2DWP.woff","./assets/inter-latin-600-normal-LgqL8muc.woff2","./assets/jetbrains-mono-cyrillic-400-normal-BEIGL1Tu.woff2","./assets/jetbrains-mono-cyrillic-400-normal-ugxPyKxw.woff","./assets/jetbrains-mono-latin-400-normal-6-qcROiO.woff","./assets/jetbrains-mono-latin-400-normal-V6pRDFza.woff2","./assets/pirata-one-latin-400-normal-C8jLWNfm.woff2","./assets/pirata-one-latin-400-normal-CiJE7gJH.woff","./assets/ruslan-display-cyrillic-400-normal-CrNaAs1F.woff2","./assets/ruslan-display-cyrillic-400-normal-EbEJim7_.woff","./assets/ruslan-display-latin-400-normal--TcDHj-M.woff","./assets/ruslan-display-latin-400-normal-Bw2GNpT4.woff2","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-mark.svg","./icons/icon-maskable-512.png","./icons/icon-mono-512.png","./icons/icon.svg","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Навигация: сначала сеть (чтобы получать обновления), офлайн — из кэша.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./', { ignoreSearch: true })),
    );
    return;
  }

  // Статика: сначала кэш (файлы с хэшами в именах не меняются).
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
