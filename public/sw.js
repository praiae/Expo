// Service worker da Expo Connect Angola.
// Regras: ficheiros estáticos em cache (rápido e offline); páginas sempre da rede, com página offline de recurso.
// A área reservada (/app) e a API nunca são guardadas em cache — contêm dados pessoais.
const VERSAO = 'ec-v1';
const ESTATICOS = ['/offline.html', '/logo.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/app') || url.pathname.startsWith('/api')) {
    // Dados pessoais: só rede. Sem ligação, mostra a página offline.
    if (req.mode === 'navigate') e.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }
  // Ficheiros com nome versionado (/_astro/…) e imagens: cache primeiro.
  if (url.pathname.startsWith('/_astro/') || /\.(png|svg|webp|jpg|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
      return res;
    })));
    return;
  }
  // Páginas públicas: rede primeiro; guarda a última versão para leitura offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('/offline.html'))));
  }
});
