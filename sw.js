// 口袋記帳本：離線快取。更新網站時把版本號 +1。
const CACHE = "pocket-ledger-v4";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 自己的頁面：先抓網路（拿到最新版），沒網路才用快取
  if (url.origin === location.origin) {
    e.respondWith(fetch(req,{cache:"no-cache"}).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  // 字型：先用快取
  if (url.host.endsWith("googleapis.com") || url.host.endsWith("gstatic.com")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  }
});
