self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  if(e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request, {cache:'no-store'}));
});
