// YourPOS 360 · işletme ekranı (isletme.html) cihazda saklanır: internet yokken de açılabilsin (1.22.0)
// Yalnız isletme.html'e karışır: önce ağdan ister (her zaman güncel), ağ yoksa son saklanan kopyayı açar.
// 1.30 · Tarayıcı bildirimi: sunucunun gönderdiği bildirimi gösterir (müşteriye sipariş durumu, işletmeye yeni sipariş);
// dokununca açık sayfaya geçer, yoksa sayfayı açar.
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

self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch(x){ d = { b: e.data ? e.data.text() : '' }; }
  var se = { body: String(d.b || ''), icon: 'ikon-192.png', badge: 'ikon-rozet.png', data: { u: String(d.u || '') }, lang: String(d.l || '') || undefined };
  if (d.tag) { se.tag = String(d.tag); se.renotify = true; }
  e.waitUntil(self.registration.showNotification(String(d.t || 'YourPOS 360'), se));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var u = (e.notification.data && e.notification.data.u) || '';
  var hedef;
  try { hedef = new URL(u || './', self.registration.scope); } catch(x){ hedef = new URL('./', self.registration.scope); }
  if (hedef.origin !== self.location.origin) hedef = new URL(hedef.pathname + hedef.search, self.location.origin);
  var yol = function(x){ return x.pathname.replace(/index\.html$/, ''); };
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(l){
    for (var i = 0; i < l.length; i++) {
      var c = new URL(l[i].url);
      if (yol(c) === yol(hedef) && c.searchParams.get('b') === hedef.searchParams.get('b') && 'focus' in l[i]) return l[i].focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(hedef.href) : null;
  }));
});
