// --- GitHub Pages URL設定 ---
const GITHUB_CSV_URL = 'https://mjy-mo.github.io/bird-pokedex/bird-list.csv';
const GITHUB_VERSION_URL = 'https://mjy-mo.github.io/bird-pokedex/version.txt';

// --- ★ 機能追加: IndexedDB データベース設定 ---
const DB_NAME = 'BirdPokedexDB';
const DB_VERSION = 1;
const STORE_BIRDS = 'birdDatabase';
const STORE_EVENTS = 'events';
// ★★★ バーダーカード保存用のストアを追加 ★★★
const STORE_CARDS = 'receivedCards'; 

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
            // ★★★ 'receivedCards' ストア（テーブル）を作成 ★★★
            if (!db.objectStoreNames.contains(STORE_CARDS)) {
                // 'id' をキー（主キー）として使用
                db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
            }
        },
    });
    return db;
}
// --- IndexedDB 設定ここまで ---


// --- グローバル変数 ---
const app = document.getElementById('app');
const header = document.getElementById('header');
const headerTitle = document.getElementById('headerTitle');
const backButton = document.getElementById('backButton');

const headerActions = document.getElementById('headerActions');
const searchToggleButton = document.getElementById('search-toggle-button');
const filterToggleButton = document.getElementById('filter-toggle-button');
const viewToggleButton = document.getElementById('view-toggle-button');
const filterActiveDot = document.getElementById('filter-active-dot');

const searchPopup = document.getElementById('search-popup');
const filterPopup = document.getElementById('filter-popup');
const viewPopup = document.getElementById('view-popup');

let birdDatabase = [];
let processedBirdList = [];
let currentBird = null;
let allOrders = [];
let birdEvents = [];
let currentEventIndex = -1;
// ★★★ もらったカードを保存するグローバル変数 ★★★
let receivedCards = []; 

// --- 絞り込み項目の定義 ---
const filterableSeasons = ['留鳥', '夏鳥', '冬鳥', '旅鳥', '迷鳥'];
const filterableTypes = [
    '海鳥', 'カモメ', 'ガンカモ', 'ツル', 'サギ', 'シギ', 'ハト', '猛禽',
    'トケン', 'キツツキ', 'セキレイ', 'ツバメ類', 'ヒタキ', 'ムシクイ',
    'カラ類', 'その他'
];
const habitatKeys = [
    { key: 'habitat_hokkaido', label: '北海道' }, { key: 'habitat_honshu', label: '本州' },
    { key: 'habitat_shikoku', label: '四国' }, { key: 'habitat_kyushu', label: '九州' },
    { key: 'habitat_islands', label: '島嶼' },
];
const sizeRanges = {
    s1: { label: '~ 20cm', min: 0, max: 20 }, s2: { label: '20 ~ 40cm', min: 20, max: 40 },
    s3: { label: '40 ~ 60cm', min: 40, max: 60 }, s4: { label: '60 ~ 100cm', min: 60, max: 100 },
    s5: { label: '100cm ~', min: 100, max: Infinity },
};


// --- アプリケーションの状態管理 ---
const appState = {
    currentPage: 'list',
    currentBirdId: null,
    isEditing: false,
    listControls: {
        filterText: '',
        sort: 'name_asc',
        filters: {
            season: [], type: [...filterableTypes], habitat: habitatKeys.map(h => h.key),
            size: Object.keys(sizeRanges), classification: { orders: [], family: null },
            edited: 'all',
            lifer: {
                seen: 'any', // 'any', 'yes', 'no'
                heard: 'any',
                photo: 'any',
                video: 'any'
            }
        },
        viewMode: 'tile', activePopup: null, openFilterSection: null,
        currentPage: 1, itemsPerPage: 30,
    },
    eventControls: {
        listSort: 'dateTime_desc',
        detailSort: 'added_asc',
        currentPage: 1,
        filterBirdName: '',
        filterObservedType: 'any'
    },
    settings: {
        autoUpdateLiferList: true,
        // ★★★ バーダーカード用の設定を追加 ★★★
        birderName: '',
        birderPhoto: '' // Base64文字列
    }
};

// --- CSV行を鳥オブジェクトに変換 ---
function convertPapaRowToBirdObject(row) {
    const obj = {};
    const requiredKeys = ['id', 'name', 'classification'];
    const allHeaders = [
        'id', 'name', 'classification', 'size', 'special_notes',
        'habitat_hokkaido', 'habitat_honshu', 'habitat_shikoku', 'habitat_kyushu', 'habitat_islands',
        'type', 'season', 'rarity',
        'description', 'photo_url', 'observed_date', 'observed_location',
        'lastObservedEventId', 'voice_url',
        'lifer_seen', 'lifer_heard', 'lifer_photo', 'lifer_video'
    ];
    let hasRequiredData = true;
    allHeaders.forEach(key => {
        let val = row ? row[key] : "";
        val = val ? val.trim() : "";
        obj[key] = (val === '""' || val === '"') ? "" : val;
        if (requiredKeys.includes(key) && !obj[key]) hasRequiredData = false;
    });
    if (obj.description === undefined) obj.description = "";
    if (obj.photo_url === undefined) obj.photo_url = "";
    if (obj.observed_date === undefined) obj.observed_date = "";
    if (obj.observed_location === undefined) obj.observed_location = "";
    if (obj.lastObservedEventId === undefined) obj.lastObservedEventId = "";
    if (obj.voice_url === undefined) obj.voice_url = "";
    obj.lifer_seen = (obj.lifer_seen === 'true' || obj.lifer_seen === true);
    obj.lifer_heard = (obj.lifer_heard === 'true' || obj.lifer_heard === true);
    obj.lifer_photo = (obj.lifer_photo === 'true' || obj.lifer_photo === true);
    obj.lifer_video = (obj.lifer_video === 'true' || obj.lifer_video === true);
    return hasRequiredData ? obj : null;
}


// --- DBカラム定義 ---
const MASTER_COLUMNS = [
    'name', 'classification', 'size', 'special_notes',
    'habitat_hokkaido', 'habitat_honshu', 'habitat_shikoku', 'habitat_kyushu', 'habitat_islands',
    'type'
];
const LOCAL_COLUMNS = [
    'season', 'rarity', 'description', 'photo_url', 'observed_date', 'observed_location',
    'lastObservedEventId', 'voice_url',
    'lifer_seen', 'lifer_heard', 'lifer_photo', 'lifer_video'
];


// --- データベース初期化 ---
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
        
        // ★★★ 2. もらったカードデータを IndexedDB から読み込む ★★★
        const storedCards = await db.getAll(STORE_CARDS);
        if (storedCards && Array.isArray(storedCards)) {
            receivedCards = storedCards;
        } else {
            receivedCards = [];
        }

        // 3. 鳥データを IndexedDB から読み込む
        const storedData = await db.getAll(STORE_BIRDS);
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
            birdDatabase = storedData;
            console.log(`Loaded ${birdDatabase.length} birds from IndexedDB`);
            await checkAndUpdateData(); 
        } else {
            birdDatabase = [];
            console.log('No bird data found in IndexedDB. Checking remote CSV...');
            await fetchCSVAndSave(); 
        }

    } catch (e) {
        console.error("Failed to initialize database:", e);
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
        birdDatabase = [];
        birdEvents = [];
        receivedCards = []; // ★ エラー時も初期化
    }
    
    updateAllOrdersList(); 
    processedBirdList = [...birdDatabase];
}

// --- 「目」リスト更新 ---
function updateAllOrdersList() {
     allOrders = [...new Set(birdDatabase.map(b => {
        if (!b || !b.classification) return null;
        const match = b.classification.match(/^(.+?目)/);
        return match ? match[1] : null;
    }).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'ja'));
}


// --- ローディングメッセージ ---
function showLoadingMessage(message) {
    if (app) {
        app.innerHTML = `<div class="bg-white rounded-lg shadow p-6 text-center"><h2 class="text-xl font-semibold mb-4">${message}</h2><p class="text-gray-600">しばらくお待ちください...</p></div>`;
    } else {
         console.error("App element not found, cannot show loading message.");
    }
    updateHeader('loading');
}


// --- CSVダウンロード & 保存 ---
async function fetchCSVAndSave() {
    if (localStorage.getItem('birdDatabaseLoadError') && !GITHUB_CSV_URL.includes('[YOUR_USERNAME]')) {
        console.warn("Skipping fetchCSVAndSave due to existing load error. Clear data to retry.");
    }
    if (GITHUB_CSV_URL.includes('[YOUR_USERNAME]')) { showSettingsPage(); return; }
    
    try {
        console.log("Fetching CSV from:", GITHUB_CSV_URL); 
        const response = await fetch(`${GITHUB_CSV_URL}?cachebust=${new Date().getTime()}`);
        console.log("Fetch response status:", response.status); 
        if (!response.ok) throw new Error(`Network response was not ok (HTTP ${response.status})`);
        
        const csvText = await response.text();
        if (!csvText || csvText.length === 0) throw new Error("Downloaded CSV text is empty."); 
        console.log("CSV text fetched, length:", csvText.length); 
        
        const parsedResult = Papa.parse(csvText, { header: true, skipEmptyLines: true, trimHeaders: true });
        if (parsedResult.errors.length > 0) {
             console.warn('PapaParse Errors:', parsedResult.errors);
             if (parsedResult.errors.some(err => err.code === 'MissingHeaders' || err.code === 'IncorrectHeaders')) {
                 throw new Error(`CSV Parsing failed due to header issues: ${parsedResult.errors[0].message}`);
             }
        }
        if (!parsedResult.data || parsedResult.data.length === 0) throw new Error('CSVの解析に失敗しました。データが0件です。');
        console.log("CSV parsed, rows:", parsedResult.data.length); 
        
        const newBirdDatabase = parsedResult.data.map(convertPapaRowToBirdObject).filter(Boolean); 
        console.log("Converted to Bird Objects, count:", newBirdDatabase.length); 
        
        if (newBirdDatabase.length === 0) throw new Error('必須データ(id, name, classification)を持つ行が0件でした。');
        
        birdDatabase = newBirdDatabase; // グローバル変数を更新
        updateAllOrdersList();
        
        await saveDatabase(); 
        
        localStorage.setItem('birdDataVersion', new Date().getTime().toString());
        localStorage.setItem('lastSyncStatus', new Date().toISOString());
        localStorage.removeItem('birdDatabaseLoadError'); 
        console.log(`Successfully fetched and saved ${birdDatabase.length} birds.`);
        
    } catch (error) {
        console.error('Fetch CSV Error:', error);
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
        birdDatabase = []; 
        updateAllOrdersList(); 
        try {
            if (app) { 
                app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">データ取得エラー</strong><span class="block sm:inline">GitHubからのデータダウンロードに失敗しました。</span><p class="text-sm mt-2">詳細: ${escapeHTML(error.message)}</p><p class="mt-2 text-sm">「設定」タブから再試行してください。</p></div>`;
            }
            updateHeader('error', '同期エラー'); 
        } catch(e) { console.error("Error displaying fetch error:", e); }
    }
}


// --- データ更新 (マージ) ---
async function checkAndUpdateData() {
    if (localStorage.getItem('birdDatabaseLoadError')) {
        console.warn("Skipping checkAndUpdateData due to existing load error.");
        return;
    }
    if (GITHUB_VERSION_URL.includes('[YOUR_USERNAME]')) { console.warn('GitHub URL not set. Skipping update check.'); return; }
    
    let remoteVersion = '';
    try {
        const response = await fetch(`${GITHUB_VERSION_URL}?cachebust=${new Date().getTime()}`);
        if (!response.ok) throw new Error('バージョンファイルの取得に失敗');
        remoteVersion = (await response.text()).trim();
    } catch (error) { console.error('Update check failed:', error); return; }
    
    const localVersion = localStorage.getItem('birdDataVersion') || '0';
    if (remoteVersion === localVersion || parseFloat(localVersion) >= parseFloat(remoteVersion)) {
        console.log('Data is up to date.');
        localStorage.setItem('lastSyncStatus', new Date().toISOString()); return; 
    }
    
    console.log(`New version found. Local: ${localVersion}, Remote: ${remoteVersion}. Syncing...`);
    showLoadingMessage("新しい図鑑データを同期中...");
    
    try {
        const response = await fetch(`${GITHUB_CSV_URL}?cachebust=${new Date().getTime()}`);
        if (!response.ok) throw new Error('マスターCSVの取得に失敗');
        const csvText = await response.text();
         if (!csvText || csvText.length === 0) throw new Error("Downloaded CSV text for merge is empty."); 
         
        const parsedResult = Papa.parse(csvText, { header: true, skipEmptyLines: true, trimHeaders: true });
        if (parsedResult.errors.length > 0) {
             console.warn('PapaParse Errors on merge:', parsedResult.errors);
              if (parsedResult.errors.some(err => err.code === 'MissingHeaders' || err.code === 'IncorrectHeaders')) {
                 throw new Error(`CSV Parsing failed during merge due to header issues: ${parsedResult.errors[0].message}`);
             }
        }
        if (!parsedResult.data || parsedResult.data.length === 0) throw new Error('マスターCSVの解析に失敗 (0件)');
        
        const masterDataList = parsedResult.data.map(convertPapaRowToBirdObject).filter(Boolean); 
         if (masterDataList.length === 0) throw new Error('マスターCSVから有効な鳥データが0件でした (マージ時)。'); 
         
        const localDataMap = new Map(birdDatabase.map(bird => [bird.id, bird]));
        const newDatabase = masterDataList.map(masterBird => {
            const localBird = localDataMap.get(masterBird.id);
            if (localBird) {
                const mergedBird = { ...masterBird }; 
                LOCAL_COLUMNS.forEach(key => { if (localBird[key] !== undefined) mergedBird[key] = localBird[key]; });
                localDataMap.delete(masterBird.id); 
                return mergedBird;
            } else { return masterBird; }
        });
        localDataMap.forEach(remainingLocalBird => newDatabase.push(remainingLocalBird));
        
        birdDatabase = newDatabase; // グローバル変数を更新
        updateAllOrdersList();
        
        await saveDatabase(); 
        
        localStorage.setItem('birdDataVersion', remoteVersion); 
        localStorage.setItem('lastSyncStatus', new Date().toISOString());
        localStorage.removeItem('birdDatabaseLoadError'); 
        console.log('Data merge completed.');
        
    } catch (error) { 
        console.error('Data merge failed:', error); 
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
    }
    
    loadListControlsState(); 
}


// --- DB保存 (鳥) ---
async function saveDatabase() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_BIRDS, 'readwrite');
        
        await tx.store.clear(); 
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
async function saveEventsData() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_EVENTS, 'readwrite');
        
        await tx.store.clear();
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


// ★★★ DB保存 (もらったカード) ★★★
async function saveReceivedCards() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_CARDS, 'readwrite');
        
        await tx.store.clear();
        // receivedCards グローバル変数から保存
        await Promise.all(receivedCards.map(card => tx.store.put(card)));
        await tx.done;

        console.log(`Successfully saved ${receivedCards.length} received cards to IndexedDB.`);
     } 
     catch (e) { 
        console.error('Failed to save received cards to IndexedDB:', e); 
     }
}

// --- 状態保存 (リスト制御) ---
function saveListControlsState() { 
    try {
        const stateToSave = { 
            ...appState.listControls, 
            eventControls: appState.eventControls,
            settings: appState.settings, // ★ ライフリスト設定も保存
            currentPage: 1 
        };
        localStorage.setItem('birdListControls', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Failed to save list controls state:', e);
    }
}


// --- 状態読み込み (リスト制御) ---
function loadListControlsState() { 
    let storedState = null;
    try {
         storedState = localStorage.getItem('birdListControls');
    } catch(e) {
        console.error("Failed to read list controls state:", e);
        localStorage.removeItem('birdListControls'); 
    }

    const defaultSeasons = filterableSeasons.filter(s => s !== '迷鳥');
    const defaultClassificationOrders = Array.isArray(allOrders) ? [...allOrders] : []; 
    
    const defaultLiferFilter = {
        seen: 'any', heard: 'any', photo: 'any', video: 'any'
    };
    const defaultFilters = {
        season: [...defaultSeasons], type: [...filterableTypes], habitat: habitatKeys.map(h => h.key),
        size: Object.keys(sizeRanges), classification: { orders: defaultClassificationOrders, family: null }, 
        edited: 'all',
        lifer: defaultLiferFilter 
    };
    
    const defaultEventControls = {
        listSort: 'dateTime_desc',
        detailSort: 'added_asc',
        currentPage: 1,
        filterBirdName: '',
        filterObservedType: 'any'
    };
    
    // ★★★ デフォルトにカード設定を追加 ★★★
    const defaultSettings = {
        autoUpdateLiferList: true,
        birderName: '',
        birderPhoto: ''
    };

    if (storedState) {
        let loadedState = {};
        try {
            loadedState = JSON.parse(storedState);
            if (typeof loadedState !== 'object' || loadedState === null) {
                 throw new Error("Parsed state is not an object");
            }
        } catch(e) {
            console.error("Failed to parse list controls state, using defaults:", e);
            localStorage.removeItem('birdListControls'); 
            loadedState = {}; 
        }

        loadedState.activePopup = null; loadedState.openFilterSection = null; loadedState.currentPage = 1; 
        
        const loadedFilters = loadedState.filters || {};
        const loadedClassification = (typeof loadedFilters.classification === 'object' && loadedFilters.classification !== null) ? loadedFilters.classification : {};
        
        loadedState.filters = {
            ...defaultFilters, 
            ...loadedFilters,
            classification: { 
                ...defaultFilters.classification, 
                ...loadedClassification, 
                orders: (loadedClassification && Array.isArray(loadedClassification.orders)) 
                        ? loadedClassification.orders 
                        : defaultClassificationOrders 
            },
            season: loadedFilters.season || [...defaultSeasons],
            lifer: (loadedFilters.lifer && typeof loadedFilters.lifer === 'object') ? 
                   { ...defaultLiferFilter, ...loadedFilters.lifer } : 
                   defaultLiferFilter
        };
        delete loadedState.filters.liferStatus; 
        delete loadedState.filters.photo;
        
        appState.listControls = { ...appState.listControls, ...loadedState };
        appState.eventControls = { ...defaultEventControls, ...(loadedState.eventControls || {}) };
        // ★★★ settings もマージする ★★★
        appState.settings = { ...defaultSettings, ...(loadedState.settings || {}) }; 
        
        delete appState.listControls.eventControls; 
        delete appState.listControls.settings; // 互換性のため

    } else {
        defaultFilters.classification.orders = defaultClassificationOrders; 
        appState.listControls.filters = defaultFilters;
        appState.eventControls = defaultEventControls;
        appState.settings = defaultSettings; 
    }
}

// --- 絞り込み状態チェック ---
function getFilterStatus() { 
    const { filterText, filters } = appState.listControls;
    if (!filters || !filters.classification || !filters.lifer) { 
        console.warn("getFilterStatus: filters structure is incomplete.");
        return { isFiltered: false }; 
    }
    const isTextFiltered = (filterText || '').length > 0;
    const isSeasonFiltered = (filters.season || []).length !== filterableSeasons.length; 
    const isTypeFiltered = (filters.type || []).length !== filterableTypes.length;
    const isHabitatFiltered = (filters.habitat || []).length !== habitatKeys.length;
    const isSizeFiltered = (filters.size || []).length !== Object.keys(sizeRanges).length;
    const isClassificationFiltered = (filters.classification.orders || []).length !== allOrders.length;
    const isEditedFiltered = filters.edited !== 'all'; 
    const isLiferStatusFiltered = filters.lifer.seen !== 'any' || filters.lifer.heard !== 'any' || filters.lifer.photo !== 'any' || filters.lifer.video !== 'any';
    
    const isFiltered = isTextFiltered || isSeasonFiltered || isTypeFiltered || isHabitatFiltered || isSizeFiltered || isClassificationFiltered || isEditedFiltered || isLiferStatusFiltered; 
    
    return { isFiltered, isTextFiltered, isSeasonFiltered, isTypeFiltered, isHabitatFiltered, isSizeFiltered, isClassificationFiltered, isEditedFiltered, isLiferStatusFiltered }; 
} 


// --- ヘッダー更新 ---
function updateHeader(mode, title = "鳥類図鑑") { 
    try { 
        if (!headerTitle || !backButton || !headerActions || !searchPopup || !filterPopup || !viewPopup || !app || !searchToggleButton || !filterToggleButton || !viewToggleButton || !filterActiveDot) {
            console.error("Header elements not found, skipping update.");
            return;
        }
        
        headerTitle.textContent = title;
        backButton.classList.add('hidden');
        headerActions.classList.add('hidden'); 
        searchPopup.classList.add('hidden'); filterPopup.classList.add('hidden'); viewPopup.classList.add('hidden');
        app.classList.remove('pt-popup');
        searchToggleButton.classList.remove('active'); filterToggleButton.classList.remove('active'); viewToggleButton.classList.remove('active');
        filterActiveDot.classList.add('hidden');

        if (mode === 'list') {
            headerActions.classList.remove('hidden'); app.classList.add('pt-popup'); 
            if (getFilterStatus().isFiltered) filterActiveDot.classList.remove('hidden');
            const { activePopup } = appState.listControls;
            if (activePopup === 'search') { searchToggleButton.classList.add('active'); searchPopup.classList.remove('hidden'); renderSearchPopup(); } 
            else if (activePopup === 'filter') { filterToggleButton.classList.add('active'); filterPopup.classList.remove('hidden'); renderFilterPopup(); } 
            else if (activePopup === 'view') { viewToggleButton.classList.add('active'); viewPopup.classList.remove('hidden'); renderViewPopup(); }
        } else if (mode === 'detail' || mode === 'edit') {
            backButton.classList.remove('hidden');
            backButton.textContent = mode === 'edit' ? "< 中止" : "< 戻る";
            backButton.onclick = mode === 'edit' ? () => showDetailPage(appState.currentBirdId) : () => showListPage(); 
        } else if (mode === 'newEvent' || mode === 'eventDetail') { 
             backButton.classList.remove('hidden');
             backButton.textContent = "< 戻る";
             backButton.onclick = () => {
                 if (mode === 'eventDetail') {
                     // (将来的に: イベントリストの表示位置に戻る)
                 }
                 showEventsPage(); 
             };
        } else if (mode === 'error' || mode === 'loading') {
            // アクションなし
        }
    } catch (error) {
        console.error("Error updating header:", error);
    }
}


// --- ポップアップ開閉 (共通) ---
function togglePopup(popupName) { 
    const { activePopup } = appState.listControls;
    appState.listControls.activePopup = (activePopup === popupName) ? null : popupName;
    if (popupName !== 'filter') appState.listControls.openFilterSection = null;
    updateHeader('list'); 
}
function closePopupsOnMainTap(event) { 
    if (appState.listControls.activePopup === null) return; 
    const clickedInsidePopup = event.target.closest('.popup-panel');
    const clickedHeaderButton = event.target.closest('.header-action-button');
    const clickedEventSuggestion = event.target.closest('.event-suggestion-list');
    
    if (!clickedInsidePopup && !clickedHeaderButton && !clickedEventSuggestion) {
        appState.listControls.activePopup = null;
        appState.listControls.openFilterSection = null; 
        updateHeader('list');
    }
}


// --- ユーティリティ関数 (共通) ---
function getSizeRange(sizeCm) { 
    const sizeString = String(sizeCm || '');
    const match = sizeString.match(/(\d+(\.\d+)?)/); 
    const size = match ? parseFloat(match[1]) : NaN;
    if (isNaN(size)) return null;
    for (const [key, range] of Object.entries(sizeRanges)) {
        if (size >= range.min && size < range.max) return key;
        if (size >= range.min && range.max === Infinity) return key;
    }
    if (size === 20) return 's2'; if (size === 40) return 's3';
    if (size === 60) return 's4'; if (size === 100) return 's5';
    return null;
} 
function getSeasonTag(season) { 
    if (!season) return '';
    let tagClass = 'bg-purple-200 text-purple-700'; 
    switch (season) {
        case '留鳥': tagClass = 'bg-gray-200 text-gray-700'; break;
        case '冬鳥': tagClass = 'bg-blue-200 text-blue-700'; break;
        case '夏鳥': tagClass = 'bg-green-200 text-green-700'; break;
        case '旅鳥': tagClass = 'bg-yellow-200 text-yellow-700'; break;
    }
    return `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${tagClass}">${season}</span>`;
} 
function getHabitatLabels(bird) { 
    return habitatKeys.filter(h => bird[h.key] === '1').map(h => h.label);
} 
function escapeHTML(str) { 
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
} 
function toHiragana(str) { 
    if (!str) return '';
    return str.replace(/[\u30A1-\u30F6]/g, m => String.fromCharCode(m.charCodeAt(0)-0x60));
} 
function getSearchSuggestions(text) { 
    if (!text) return []; 
    const hText = toHiragana(text);
    const startsWith = [];
    const includes = [];
    
    birdDatabase.forEach(b => {
        const hName = toHiragana(b.name || '');
        if (hName.startsWith(hText)) {
            startsWith.push(b.name);
        } else if (hName.includes(hText)) {
            includes.push(b.name);
        }
    });
    
    const jaCollator = new Intl.Collator('ja');
    startsWith.sort(jaCollator.compare);
    includes.sort(jaCollator.compare);
    
    return [...startsWith, ...includes].slice(0, 5); 
} 


// --- タブ切り替え ---
function setupTabs() { 
    const tabs = [ { id: 'tab-pokedex', page: showListPage }, { id: 'tab-events', page: showEventsPage }, { id: 'tab-settings', page: showSettingsPage } ];
    tabs.forEach(tab => {
        const button = document.getElementById(tab.id);
        if (button) { 
            button.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    const btn = document.getElementById(t.id);
                    if (btn) btn.classList.replace('tab-active', 'tab-inactive');
                });
                if (e.currentTarget) e.currentTarget.classList.replace('tab-inactive', 'tab-active'); 
                tab.page();
            });
        } else {
            console.error(`Tab button #${tab.id} not found`);
        }
    });
 }


// --- ★ 機能追加: カスタム確認モーダル（クッション） ---
async function showCustomConfirm(text, okLabel = 'OK', hideCancel = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const modalText = document.getElementById('confirm-modal-text');
        const okButton = document.getElementById('confirm-btn-ok');
        const cancelButton = document.getElementById('confirm-btn-cancel');

        if (!modal || !modalText || !okButton || !cancelButton) {
            console.error("Custom confirm modal elements not found.");
            resolve(false); 
            return;
        }

        modalText.innerHTML = escapeHTML(text).replace(/\n/g, '<br>');
        okButton.textContent = okLabel;

        cancelButton.classList.toggle('hidden', hideCancel);
        
        okButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'bg-emerald-600', 'hover:bg-emerald-700');
        
        if (okLabel.includes('削除') || okLabel.includes('リセット') || okLabel.includes('インポート') || okLabel.includes('上書き')) {
            okButton.classList.add('bg-red-600', 'hover:bg-red-700');
        } else {
            okButton.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
        }

        modal.classList.remove('hidden');

        const newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);
        
        const newCancelButton = cancelButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

        newOkButton.onclick = () => {
            hideCustomConfirm();
            resolve(true);
        };

        newCancelButton.onclick = () => {
            hideCustomConfirm();
            resolve(false);
        };
        
        modal.onclick = (e) => {
            if (e.target.id === 'custom-confirm-modal') {
                // (何もしない。モーダル背景クリックで閉じないようにする)
            }
        };
    });
}
function hideCustomConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}


// --- ★ 機能追加: 背景設定 ---
function applyBackgroundSettings() {
    const defaultSettings = {
        bgColor: '#f3f4f6', // bg-gray-100
        bgImage: '',
        bgOpacity: 0.1
    };
    
    let settings;
    try {
        const storedSettings = localStorage.getItem('birdAppBackground');
        settings = storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch (e) {
        console.error("Failed to parse background settings:", e);
        settings = defaultSettings;
    }

    const body = document.body;
    const overlay = document.getElementById('background-overlay');

    if (!body || !overlay) {
        return;
    }

    body.style.backgroundColor = settings.bgColor;

    if (settings.bgImage && settings.bgImage.startsWith('data:image')) {
        overlay.style.backgroundImage = `url(${settings.bgImage})`;
        overlay.style.opacity = settings.bgOpacity;
    } else {
        overlay.style.backgroundImage = 'none';
        overlay.style.opacity = 0;
    }
}

// --- ★★★ アプリケーション初期化 ★★★ ---
(async () => { 
    try { 
        // アプリ起動時に背景設定を適用
        applyBackgroundSettings();
        
        setupTabs(); 
        await initializeDatabase(); 
        loadListControlsState();    
        showListPage(); // 初期表示は図鑑リスト
        if (app) {
            app.addEventListener('click', closePopupsOnMainTap);
        } else {
            console.error("Main app element not found");
        }
    } catch (error) {
        console.error("Initialization failed:", error);
        if (app) {
            app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">アプリ起動エラー</strong><span class="block sm:inline">アプリの起動に失敗しました。</span><p class="mt-2">開発者コンソール(F12)で詳細を確認してください。</p></div>`;
        }
        try { updateHeader('error', 'エラー'); } catch(e) { console.error("Failed to update header on error:", e); } 
    }
})();
```eof