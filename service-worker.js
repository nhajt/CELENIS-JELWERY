const CACHE_NAME = 'my-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',  // Thêm trang dự phòng khi offline
  '/styles.css',
  '/script.js',
  '/video1.mp4',
  '/video2.mp4',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/Nhẫn Đính Hôn Sapphire.jpg',
  '/Nhẫn Bạc Ý Đính Đá CZ.jpg',
  '/Bông tai ngọc trai.jpg',
  '/Vòng Cổ Dancing Swan.jpg',
  '/lactayco4la.jpg',
  '/Lắc tay đá xanh.jpg',
  '/Dây truyền trái tim.jpg',
  '/Dây truyền hình bướm.jpg',
  '/daytruyenbac.jpg',
  '/trangsuc.jpg',
  '/daytruyentang.jpg',
  '/lactay.jpg'
];

// Caching resources during service worker installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Function to save video to IndexedDB
function saveVideoToIndexedDB(blob, videoName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('videoDB', 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'name' });
      }
    };

    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const addRequest = store.put({ name: videoName, videoBlob: blob });

      addRequest.onsuccess = () => resolve(true);
      addRequest.onerror = () => reject('Error saving video to IndexedDB');
    };

    request.onerror = () => reject('Failed to open IndexedDB');
  });
}

// Function to retrieve video from IndexedDB
function getVideoFromIndexedDB(videoName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('videoDB', 1);

    request.onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction(['videos'], 'readonly');
      const store = transaction.objectStore('videos');
      const getRequest = store.get(videoName);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(URL.createObjectURL(getRequest.result.videoBlob));
        } else {
          reject('Video not found in IndexedDB');
        }
      };

      getRequest.onerror = () => reject('Error retrieving video from IndexedDB');
    };

    request.onerror = () => reject('Failed to open IndexedDB');
  });
}

// Fetching resources and serving from cache, with a fallback to offline page and IndexedDB for video
self.addEventListener('fetch', event => {
  if (event.request.url.endsWith('.mp4')) { // Handle video files separately
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request).then(networkResponse => {
          // Only cache successful network responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache); // Save to cache
          });

          // Save video to IndexedDB
          networkResponse.clone().blob().then(blob => {
            saveVideoToIndexedDB(blob, event.request.url);
          });

          return networkResponse;
        }).catch(() => {
          // If both cache and network fail, try loading from IndexedDB
          return getVideoFromIndexedDB(event.request.url).then(videoUrl => {
            return new Response(new Blob([videoUrl], { type: 'video/mp4' }));
          }).catch(() => caches.match('/offline.html')); // Fallback if video is not in IndexedDB
        });
      })
    );
  } else {
    // Handle other resources
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request).then(networkResponse => {
          // Only cache successful network responses
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache); // Save to cache
          });
          return networkResponse;
        }).catch(() => {
          // If both cache and network fail, show offline page
          return caches.match('/offline.html');
        });
      })
    );
  }
});

// Cleaning up old caches during activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // Delete old cache versions
          }
        })
      );
    })
  );
});
