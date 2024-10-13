// service-worker.js
const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
  '/',
  '/styles.css',  // Đường dẫn đến file CSS của bạn
  '/index.html',  // Đường dẫn đến file HTML của bạn
  '/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response; // Trả về dữ liệu từ cache
        }
        return fetch(event.request); // Nếu không có trong cache, tải từ mạng
      }
    )
  );
});
