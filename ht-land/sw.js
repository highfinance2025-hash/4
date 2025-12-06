// service-worker.js - نسخه ساده شده
const CACHE_NAME = 'healthy-taste-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/data.json',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/cart.js',
  '/assets/js/wishlist.js',
  '/assets/js/seo-manager.js',
  '/assets/js/performance.js',
  '/assets/js/helpers.js',
  '/manifest.json',
  '/assets/images/logo.png',
  '/assets/images/favicon.ico'
];

// نصب Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker در حال نصب...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('خطا در caching:', error);
      })
  );
});

// فعال‌سازی
self.addEventListener('activate', event => {
  console.log('Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // اگر آفلاین باشیم و در کش نباشد
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match('/index.html');
        }
      })
  );
});

// دریافت پیام‌ها
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});