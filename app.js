// --- GitHub Pages URL設定 ---
const GITHUB_CSV_URL = 'https://mjy-mo.github.io/bird-pokedex/bird-list.csv';
const GITHUB_VERSION_URL = 'https://mjy-mo.github.io/bird-pokedex/version.txt';

// --- ★ 機能追加: IndexedDB データベース設定 ---
const DB_NAME = 'BirdPokedexDB';
const DB_VERSION = 1;
const STORE_BIRDS = 'birdDatabase';
const STORE_EVENTS = 'events';

/**
 * IndexedDB データベースを開き、ストア（テーブル）を作成する
 */
async function openBirdDB() {
    // idb.openDB は index.html で読み込んだライブラリの関数
    const db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // 'birdDatabase' ストア（テーブル）を作成
            if (!db.objectStoreNames.contains(STORE_BIRDS)) {
                // 'id' をキー（主キー）として使用
                db.createObjectStore(STORE_BIRDS, { keyPath: 'id' });
            }
            // 'events' ストア（テーブル）を作成
            if (!db.objectStoreNames.contains(STORE_EVENTS)) {
                // 'id' をキー（主キー）として使用
                db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
            }
        },
    });
    return db;
}
// --- IndexedDB 設定ここまで ---


// --- グローバル変数 ---
const app = document.getElementById('app');
const header = document.getElementById('header');
// ... (既存のグローバル変数 ...
const viewPopup = document.getElementById('view-popup');

let birdDatabase = []; 
let processedBirdList = []; 
// ... (既存のグローバル変数 ...
let currentEventIndex = -1; 

// --- 絞り込み項目の定義 ---
const filterableSeasons = ['留鳥', '夏鳥', '冬鳥', '旅鳥', '迷鳥'];
// ... (既存の絞り込み項目 ...
    s5: { label: '100cm ~', min: 100, max: Infinity },
};

// --- アプリケーションの状態管理 ---
const appState = {
// ... (既存の appState ...
    eventControls: { // イベントタブの並び替え状態
        listSort: 'dateTime_desc',
        detailSort: 'added_asc',
    }
};

// --- CSV行を鳥オブジェクトに変換 ---
function convertPapaRowToBirdObject(row) {
// ... (既存の関数 ...
    return hasRequiredData ? obj : null;
}

// --- DBカラム定義 ---
const MASTER_COLUMNS = [ 
// ... (既存の定義 ...
];
const LOCAL_COLUMNS = [ 
// ... (既存の定義 ...
];

// --- データベース初期化 ---
// ★ 修正: localStorage から IndexedDB を使うように変更
async function initializeDatabase() {
    let db;
    try {
        db = await openBirdDB();
        
        // 1. イベントデータを IndexedDB から読み込む
        const storedEvents = await db.getAll(STORE_EVENTS);
        if (storedEvents && Array.isArray(storedEvents)) {
            birdEvents = storedEvents;
        } else {
            birdEvents = [];
        }

        // 2. 鳥データを IndexedDB から読み込む
        const storedData = await db.getAll(STORE_BIRDS);
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
            birdDatabase = storedData;
            console.log(`Loaded ${birdDatabase.length} birds from IndexedDB`);
            
            // データ更新チェック（マスターCSVとのマージ）
            await checkAndUpdateData(); 
            
        } else {
            // IndexedDB が空の場合
            birdDatabase = [];
            console.log('No bird data found in IndexedDB. Checking remote CSV...');
            
            // ★ 機能追加: IndexedDBが空なら、自動でCSVを取得しにいく
            await fetchCSVAndSave(); // これがデータをDBに保存し、birdDatabaseグローバル変数も更新する
        }

    } catch (e) {
        console.error("Failed to initialize database:", e);
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
        birdDatabase = [];
        birdEvents = [];
    }
    
    updateAllOrdersList(); 
    processedBirdList = [...birdDatabase];
}

// --- 「目」リスト更新 ---
function updateAllOrdersList() {
// ... (既存の関数 ...
}

// --- ローディングメッセージ ---
function showLoadingMessage(message) {
// ... (既存の関数 ...
}

// --- CSVダウンロード & 保存 ---
async function fetchCSVAndSave() {
// ... (既存のロジック ...
    
    try {
        console.log("Fetching CSV from:", GITHUB_CSV_URL); 
        const response = await fetch(`${GITHUB_CSV_URL}?cachebust=${new Date().getTime()}`);
// ... (既存のロジック ...
        if (newBirdDatabase.length === 0) throw new Error('必須データ(id, name, classification)を持つ行が0件でした。');
        
        birdDatabase = newBirdDatabase; // グローバル変数を更新
        updateAllOrdersList();
        
        // ★ 修正: localStorage.setItem の代わりに、新しい saveDatabase (IndexedDB版) を呼ぶ
        await saveDatabase(); 
        
        localStorage.setItem('birdDataVersion', new Date().getTime().toString());
        localStorage.setItem('lastSyncStatus', new Date().toISOString());
// ... (既存のロジック ...
}

// --- データ更新 (マージ) ---
async function checkAndUpdateData() {
// ... (既存のロジック ...
    
    try {
        const response = await fetch(`${GITHUB_CSV_URL}?cachebust=${new Date().getTime()}`);
// ... (既存のロジック ...
        
        // ★ 修正: birdDatabase (IndexedDBから読み込んだデータ) をMapにする
        const localDataMap = new Map(birdDatabase.map(bird => [bird.id, bird]));
        const newDatabase = masterDataList.map(masterBird => {
// ... (既存のロジック ...
        localDataMap.forEach(remainingLocalBird => newDatabase.push(remainingLocalBird));
        
        birdDatabase = newDatabase; // グローバル変数を更新
        updateAllOrdersList();
        
        // ★ 修正: localStorage.setItem の代わりに、新しい saveDatabase (IndexedDB版) を呼ぶ
        await saveDatabase(); 
        
        localStorage.setItem('birdDataVersion', remoteVersion); 
// ... (既存のロジック ...
}

// --- DB保存 (鳥) ---
// ★ 修正: localStorage から IndexedDB への一括保存に書き換え
async function saveDatabase() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_BIRDS, 'readwrite');
        
        // ストアを一旦クリア
        await tx.store.clear(); 
        
        // メモリ上の birdDatabase 配列から、すべての鳥をDBに書き込む
        // (Promise.all で並列処理)
        await Promise.all(birdDatabase.map(bird => tx.store.put(bird)));
        
        await tx.done;
        
        console.log(`Successfully saved ${birdDatabase.length} birds to IndexedDB.`);
        localStorage.removeItem('birdDatabaseLoadError'); 
    } 
    catch (e) { 
        console.error('Failed to save database to IndexedDB:', e); 
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
    }
}

// --- DB保存 (イベント) ---
// ★ 修正: localStorage から IndexedDB への一括保存に書き換え
async function saveEventsData() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_EVENTS, 'readwrite');
        
        // ストアを一旦クリア
        await tx.store.clear();
        
        // メモリ上の birdEvents 配列から、すべてのイベントをDBに書き込む
        await Promise.all(birdEvents.map(event => tx.store.put(event)));
        
        await tx.done;

        console.log(`Successfully saved ${birdEvents.length} events to IndexedDB.`);
        localStorage.removeItem('birdDatabaseLoadError'); 
     } 
     catch (e) { 
        console.error('Failed to save events to IndexedDB:', e); 
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
     }
}

// --- 状態保存 (リスト制御) ---
// (★ 変更なし: UI状態は localStorage が最適)
function saveListControlsState() { 
// ... (既存の関数 ...
}

// --- 状態読み込み (リスト制御) ---
// (★ 変更なし: UI状態は localStorage が最適)
function loadListControlsState() { 
// ... (既存の関数 ...
        
        // ★ 修正: appState.eventControls が存在しない場合、デフォルト値を設定
        if (!loadedState.eventControls) {
            loadedState.eventControls = {
                listSort: 'dateTime_desc',
                detailSort: 'added_asc',
            };
        }

        appState.listControls = { ...appState.listControls, ...loadedState };
    } else {
        defaultFilters.classification.orders = defaultClassificationOrders; 
        appState.listControls.filters = defaultFilters;
        // ★ 修正: eventControls のデフォルト値
        appState.eventControls = {
            listSort: 'dateTime_desc',
            detailSort: 'added_asc',
        };
    }
}

// --- 絞り込み状態チェック ---
function getFilterStatus() { 
// ... (既存の関数 ...
} 

// --- ヘッダー更新 ---
function updateHeader(mode, title = "鳥類図鑑") { 
// ... (既存の関数 ...
}

// --- ポップアップ開閉 (共通) ---
function togglePopup(popupName) { 
// ... (既存の関数 ...
}
function closePopupsOnMainTap(event) { 
// ... (既存の関数 ...
}

// --- ユーティリティ関数 (共通) ---
function getSizeRange(sizeCm) { 
// ... (既存の関数 ...
} 
function getSeasonTag(season) { 
// ... (既存の関数 ...
} 
function getHabitatLabels(bird) { 
// ... (既存の関数 ...
} 
function escapeHTML(str) { 
// ... (既存の関数 ...
} 
function toHiragana(str) { 
// ... (既存の関数 ...
} 
// ★ 修正: getSearchSuggestions を pokedex.js から app.js (共通) に移動
function getSearchSuggestions(text) { 
    if (!text) return []; const hText = toHiragana(text);
    return birdDatabase.filter(b => toHiragana(b.name||'').includes(hText)).map(b => b.name).slice(0, 5); 
} 

// --- タブ切り替え ---
function setupTabs() { 
// ... (既存の関数 ...
 }

// --- アプリケーション初期化 (★ settings.js に移動済み) ---
// (コードは settings.js の末尾にあります)

