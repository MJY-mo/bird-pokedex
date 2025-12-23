// ★変更: キャッシュ名を変更して更新をトリガー (v8 -> v9)
const CACHE_NAME = 'bird-pokedex-cache-v17';

const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pokedex.js',
  './events.js',
  './settings.js',
  './manual.js',
  './manifest.json',
  './favicon.ico',
  './favicon2.png',
  './favicon3.png',
  
  // ★変更: CDNではなく、ローカルのライブラリファイルをキャッシュに追加
  './libs/tailwindcss.js',
  './libs/cropper.min.css',
  './libs/cropper.min.js',
  './libs/papaparse.min.js',
  './libs/idb.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', event => {
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

self.addEventListener('fetch', event => {
    // データURLやchrome-extensionスキームなどはキャッシュしない
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 動的にキャッシュに追加する場合はここで行うが、
                        // 今回はlibsを事前にキャッシュしているので基本的には不要。
                        // ただし、画像などその他のリソースのために残しておいても良い。
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});