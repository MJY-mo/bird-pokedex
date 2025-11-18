// キャッシュの名前を定義します。
// ★ ファイルを更新したら、必ず 'v1' の部分を 'v2', 'v3' のように変更してください
const CACHE_NAME = 'bird-pokedex-cache-v8'; // ★バージョンをv2に変更

// オフラインで動作するためにキャッシュするファイル（= アプリの本体）のリスト
const URLS_TO_CACHE = [
    // --- 基本ファイル ---
    './', // アプリのルート
    './index.html',
    './style.css',
    './manifest.json',

    // --- アイコン ---
    './favicon.ico',
    './favicon2.png',
    './favicon3.png',

    // --- JavaScript ---
    './app.js',
    './pokedex.js',
    './events.js',
    './settings.js',
    './manual.js'
    
    // ★★★ 以下の外部CDNライブラリを「すべて削除」します ★★★
    // (これらはService Workerの 'fetch' イベントによって
    //  自動的にキャッシュされるため、addAll には不要です)
    // 'https://cdn.tailwindcss.com',
    // 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js',
    // 'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    // 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
    // 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
    // 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. Service Worker の「インストール」イベント
self.addEventListener('install', (event) => {
    console.log('[SW] Install event triggered (v2)');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell...');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache addAll failed:', error);
            })
    );
});

// 2. Service Worker の「有効化」イベント
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event triggered (v2)');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[SW] Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// 3. Service Worker の「フェッチ」イベント
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // CSVやTXTは常にネットワークから取得
    if (requestUrl.pathname.endsWith('.csv') || requestUrl.pathname.endsWith('.txt')) {
        
        // ★ 修正: 'return;' の代わりに、
        // Service Worker がネットワーク取得を明示的に行う
        event.respondWith(
            fetch(event.request)
        );
        return; // respondWith を呼んだので、ここで処理を終了
    }

    // "Cache-First" 戦略
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // 1. キャッシュにあれば即座に返す
                    return cachedResponse;
                }

                // 2. キャッシュになければネットワークに取りに行く
                return fetch(event.request).then((networkResponse) => {

                    // --- ★★★ ここから修正 ★★★ ---
                    // レスポンスが正しくない場合（エラーや500など）は、キャッシュせずにそのまま返す
                    if (!networkResponse || !networkResponse.ok) {
                        return networkResponse;
                    }
                    // --- ★★★ 修正ここまで ★★★ ---

                    // 3. 取得したレスポンスをキャッシュに保存してから返す
                    // (これにより、CDNのファイルも次回からキャッシュで表示される)
                    return caches.open(CACHE_NAME).then((cache) => {
                        // networkResponse.clone() しないと、レスポンスが消費されてしまいエラーになる
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
            .catch((error) => {
                console.error('[SW] Fetch error:', error);
            })
    );
});