// YourPOS 360 · işletme ekranı (isletme.html) cihazda saklanır: internet yokken de açılabilsin (1.22.0)
// Yalnız isletme.html'e karışır: önce ağdan ister (her zaman güncel), ağ yoksa son saklanan kopyayı açar.
var KAP = 'yourpos360-isletme-1';
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(l){ return Promise.all(l.filter(function(k){ return /^yourpos360-isletme-/.test(k) && k !== KAP; }).map(function(k){ return caches.delete(k); })); })
    .then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || !/\/isletme\.html$/.test(u.pathname)) return;
  var anahtar = u.origin + u.pathname;
  e.respondWith(fetch(r).then(function(y){
    if (y && y.ok) { var k = y.clone(); caches.open(KAP).then(function(c){ return c.put(anahtar, k); }); }
    return y;
  }).catch(function(){
    return caches.open(KAP).then(function(c){ return c.match(anahtar); }).then(function(y){ return y || Response.error(); });
  }));
});
