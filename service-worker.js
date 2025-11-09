// キャッシュの名前を定義します。
// ★ ファイルを更新したら、必ず 'v1' の部分を 'v2', 'v3' のように変更してください
const CACHE_NAME = 'bird-pokedex-cache-v1';

// オフラインで動作するためにキャッシュするファイル（= アプリの本体）のリスト
// ここに index.html で読み込んでいるファイル名をすべて列挙します
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
    './manual.js',

    // --- 外部ライブラリ (CDN) ---
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',

    // --- 外部フォント ---
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 1. Service Worker の「インストール」イベント
// アプリがインストールされた時に、URLS_TO_CACHE のファイルをすべてキャッシュします
self.addEventListener('install', (event) => {
    console.log('[SW] Install event triggered');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell...');
                // addAll は、指定されたURLをすべてダウンロードし、キャッシュに追加します
                // 途中で1つでも失敗すると、インストール全体が失敗します
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => {
                // インストールが成功したら、すぐに新しい Service Worker を有効化します
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache addAll failed:', error);
            })
    );
});

// 2. Service Worker の「有効化」イベント
// 新しい Service Worker が有効（activate）になった時に、古いキャッシュを削除します
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event triggered');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // CACHE_NAME (v1) と異なる名前のキャッシュ (例: v0) があれば削除します
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[SW] Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // すべてのタブでこの Service Worker がすぐに制御できるようにします
            return self.clients.claim();
        })
    );
});

// 3. Service Worker の「フェッチ」イベント
// アプリが通信（ファイル取得）を試みるたびに、このイベントが作動します
self.addEventListener('fetch', (event) => {
    // 外部のCSVファイルやバージョンファイルへのリクエストは、
    // Service Worker が傍受せず、常にネットワークに接続させます。
    // (キャッシュしてしまうと、データが更新されなくなるため)
    const requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.endsWith('.csv') || requestUrl.pathname.endsWith('.txt')) {
        // console.log('[SW] Bypassing cache for data file:', requestUrl.pathname);
        return; // ネットワークにそのままリクエストを流す
    }

    // "Cache-First" (キャッシュファースト) 戦略
    // 1. まずキャッシュを探す
    // 2. キャッシュにあれば、それを即座に返す (→ オフラインでも表示できる)
    // 3. キャッシュになければ、ネットワークに取りに行く
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    // キャッシュにヒットした
                    // console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }
                // キャッシュになかった
                // console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request);
            })
            .catch((error) => {
                console.error('[SW] Fetch error:', error);
                // (将来的には、ここで「オフラインです」専用のページを返すこともできる)
            })
    );
});