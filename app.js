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

// --- ★★★ アプリケーション初期化 (修正) ★★★ ---
// ページのすべてのリソース（他のJSファイルを含む）が読み込まれてから起動する
window.addEventListener('load', async () => { 
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
            app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">アプリ起動エラー</strong><span class="block sm:inline">アプリの起動に失敗しました。</span><p class="mt-2">開発者コンソール(F12)で詳細を確認してください。</p><p class="mt-2 text-sm">${escapeHTML(error.message)}</p></div>`;
        }
        try { updateHeader('error', 'エラー'); } catch(e) { console.error("Failed to update header on error:", e); } 
    }
});
```eof

### 5. `settings.js` （パート1/2）
（`settings.js` ファイルの上半分です）

```markdown:settings_js_part1.txt
// --- 設定画面 ---
function showSettingsPage() { 
    appState.currentPage = 'settings'; appState.isEditing = false;
    
    // --- 1. ライフリスト集計 ---
    const totalSpecies = birdDatabase.length;
    const liferTotals = {
        seen: 0, heard: 0, photo: 0, video: 0, any: 0 
    };
    birdDatabase.forEach(bird => {
        let isLifer = false;
        if (bird.lifer_seen) { liferTotals.seen++; isLifer = true; }
        if (bird.lifer_heard) { liferTotals.heard++; isLifer = true; }
        if (bird.lifer_photo) { liferTotals.photo++; isLifer = true; }
        if (bird.lifer_video) { liferTotals.video++; isLifer = true; }
        if (isLifer) { liferTotals.any++; }
    });

    // --- 2. ★★★ 自分のバーダーカード（編集機能付き） ★★★ ---
    const myCard = appState.settings; // birderName, birderPhoto を含む
    const myPhotoUrl = myCard.birderPhoto || 'https://placehold.co/150x150/e0e0e0/b0b0b0?text=No+Image';

    const myBirderCardHtml = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">マイ・バーダーカード</h2>
            
            <div class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg mb-4">
                <img id="birder-photo-preview" src="${myPhotoUrl}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/150x150/e0e0e0/b0b0b0?text=Error';"
                     class="w-20 h-20 object-cover rounded-full border-2 border-emerald-500">
                <div>
                    <input type="text" id="birder-name-input" value="${escapeHTML(myCard.birderName || '')}" placeholder="あなたの名前" class="text-lg font-bold text-gray-800 border-b border-gray-300 focus:border-emerald-500 focus:outline-none">
                    <p class="text-sm text-gray-600 mt-1">ライフリスト: ${liferTotals.any} 種</p>
                </div>
            </div>
            
            <div>
                <label for="birder-photo-input" class="block text-sm font-medium text-gray-700">カードの写真 (5MBまで)</label>
                <input type="file" id="birder-photo-input" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                <button type="button" id="birder-remove-photo-btn" class="mt-2 text-sm font-medium text-red-600 hover:text-red-800 ${!myCard.birderPhoto ? 'hidden' : ''}">
                    写真を削除
                </button>
                <p class="text-xs text-gray-500 mt-1">名前と写真は自動保存されます。</p>
            </div>
            
            <hr class="my-6 border-gray-100">
            
            <div class="space-y-3">
                <button id="share-card-btn" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">
                    カードを送る (共有)
                </button>
                <p class="text-xs text-gray-500 text-center">
                    ${(navigator.share) ? 'LINEやAirDropでカードを送れます。' : '(お使いのブラウザは共有機能非対応です。ファイルとしてダウンロードします)'}
                </p>
            </div>
        </div>
    `;


    // --- 3. ★★★ もらったカード ★★★ ---
    const receivedCardsHtml = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">もらったカード</h2>
            
            <div>
                <label for="import-card-file" class="w-full text-center block bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg shadow-inner hover:bg-gray-100 transition-colors cursor-pointer">
                    カードを読み込む (.bcard)
                </label>
                <input type="file" id="import-card-file" accept=".bcard, application/json" class="hidden">
                <p class="text-xs text-gray-500 mt-2">受信した `.bcard` ファイルを選択してください。</p>
            </div>
            
            <hr class="my-6 border-gray-100">

            <h3 class="text-lg font-medium text-gray-800 mb-3">受信箱</h3>
            <div id="received-cards-list" class="space-y-3 max-h-60 overflow-y-auto pr-2">
                ${(receivedCards && receivedCards.length > 0) ? 
                    receivedCards.map(card => `
                        <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg" data-card-id="${card.id}">
                            <div class="flex items-center space-x-3">
                                <img src="${card.photo || 'https://placehold.co/100x100/e0e0e0/b0b0b0?text=No+Image'}" 
                                     onerror="this.onerror=null; this.src='https://placehold.co/100x100/e0e0e0/b0b0b0?text=Error';"
                                     class="w-12 h-12 object-cover rounded-full">
                                <div>
                                    <p class="font-semibold text-gray-700">${escapeHTML(card.name || '（名前なし）')}</p>
                                    <p class="text-xs text-gray-500">Lifer: ${card.totals.any} 種 (受信日: ${new Date(card.receivedDate).toLocaleDateString()})</p>
                                </div>
                            </div>
                            <button type="button" data-action="delete" class="text-red-400 hover:text-red-600 p-1 rounded-lg flex-shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    `).join('') :
                    '<p class="text-gray-400 text-sm">まだカードをもらっていません。</p>'
                }
            </div>
        </div>
    `;


    // --- 4. 既存の機能 (ライフリスト設定など) ---
    const autoUpdateChecked = appState.settings.autoUpdateLiferList ? 'checked' : '';
    const liferSettingsHtml = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">ライフリスト設定</h2>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <label for="auto-update-lifer" class="flex flex-col flex-1 mr-4">
                        <span class="font-medium text-gray-700">イベントから自動更新</span>
                        <span class="text-sm text-gray-500">イベントで鳥を登録時、自動でライフリストをONにします。</span>
                    </label>
                    <button type="button" id="auto-update-lifer-toggle" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoUpdateChecked ? 'bg-emerald-600' : 'bg-gray-200'}">
                        <span class="sr-only">自動更新を切り替え</span>
                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoUpdateChecked ? 'translate-x-6' : 'translate-x-1'}"></span>
                    </button>
                    <input type="checkbox" id="auto-update-lifer" class="hidden" ${autoUpdateChecked}>
                </div>
                
                <hr class="border-gray-100">

                <div>
                    <label class="block text-sm font-medium text-gray-700">ライフリスト再集計</label>
                    <p class="text-sm text-gray-500 mb-3">
                        過去の全イベント履歴をスキャンし、ライフリスト（目視、声など）を更新します。
                        （手動でOFFにした項目がONになることはあっても、ONの項目がOFFになることはありません）
                    </p>
                    <button id="rescan-lifer-btn" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">
                        イベント履歴からライフリストを追加
                    </button>
                </div>
            </div>
        </div>
    `;

    // --- 5. 既存の機能 (背景設定) ---
    const defaultBgSettings = { bgColor: '#f3f4f6', bgImage: '', bgOpacity: 0.1 };
    let currentBgSettings;
    try {
        const storedSettings = localStorage.getItem('birdAppBackground');
        currentBgSettings = storedSettings ? { ...defaultBgSettings, ...JSON.parse(storedSettings) } : defaultBgSettings;
    } catch (e) {
        currentBgSettings = defaultBgSettings;
    }
    const backgroundSettingsHtml = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">背景設定</h2>
            <div class="space-y-4">
                <div>
                    <label for="bg-color-picker" class="block text-sm font-medium text-gray-700">背景色</label>
                    <input type="color" id="bg-color-picker" value="${escapeHTML(currentBgSettings.bgColor)}" class="mt-1 block w-full h-10 border border-gray-300 rounded-md cursor-pointer">
                </div>
                
                <div>
                    <label for="bg-image-input" class="block text-sm font-medium text-gray-700">背景画像 (5MBまで)</label>
                    <input type="file" id="bg-image-input" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                    <button type="button" id="bg-remove-image-btn" class="mt-2 text-sm font-medium text-red-600 hover:text-red-800 ${!currentBgSettings.bgImage ? 'hidden' : ''}">
                        背景画像を削除
                    </button>
                </div>
                
                <div>
                    <label for="bg-opacity-slider" class="block text-sm font-medium text-gray-700">画像の透明度: <span id="bg-opacity-value">${currentBgSettings.bgOpacity}</span></label>
                    <input type="range" id="bg-opacity-slider" min="0.05" max="1" step="0.05" value="${currentBgSettings.bgOpacity}" class="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>
        </div>
    `;

    // --- 6. 既存の機能 (インポート/エクスポート) ---
    const importExportHtml = `
        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">観察記録のエクスポート (CSV)</h2>
            <p class="text-gray-600 mb-4">
                すべてのイベントと、それに紐づく観察記録（鳥の名前、数、確認方法など）をCSVファイルとしてダウンロードします。(1行 = 1観察記録)
            </p>
            <button id="export-csv-btn" class="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-green-700 transition-colors">
                観察記録CSVをダウンロード
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">データのエクスポート</h2>
            <p class="text-gray-600 mb-4">
                現在のすべての図鑑データ（写真・音声含む）とイベント履歴、設定を、一つのバックアップファイル（.json）としてダウンロードします。
            </p>
            <button id="export-data-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
                エクスポート実行
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 text-red-700">データのインポート</h2>
            <p class="text-gray-600 mb-4">
                エクスポートしたバックアップファイル（.json）を選択してください。<br>
                <strong class="font-medium text-red-600">注意: 現在のすべてのデータ（設定含む）は、ファイルの内容で上書きされます。</strong>
            </p>
            
            <input type="file" id="import-data-file" accept=".json, application/json" class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100">
            
            <button id="import-data-btn" class="mt-4 w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed" disabled>
                インポート実行
            </button>
        </div>
    `;
    
    // --- 画面全体の描画 ---
    app.innerHTML = `
        <div class="space-y-6">
            ${myBirderCardHtml}
            ${receivedCardsHtml}
            ${liferSettingsHtml}
            ${backgroundSettingsHtml}
            ${importExportHtml}
        </div>`;
    updateHeader('settings', '設定');
    
    
    // --- ★★★ リスナー設定 (バーダーカード機能を追加) ★★★ ---
    setTimeout(() => {
        try {
            // --- マイ・バーダーカードのリスナー ---
            const nameInput = document.getElementById('birder-name-input');
            const photoInput = document.getElementById('birder-photo-input');
            const photoPreview = document.getElementById('birder-photo-preview');
            const removePhotoBtn = document.getElementById('birder-remove-photo-btn');
            const shareCardBtn = document.getElementById('share-card-btn');

            if (nameInput) {
                nameInput.onchange = (e) => { // oninput だと保存が頻発しすぎるため onchange
                    appState.settings.birderName = e.target.value;
                    saveListControlsState(); // app.js の関数
                };
            }
            if (photoInput && photoPreview && removePhotoBtn) {
                photoInput.onchange = (e) => {
                    handleBirderPhotoChange(e, photoPreview, removePhotoBtn);
                };
                removePhotoBtn.onclick = (e) => {
                    handleBirderPhotoChange(e, photoPreview, removePhotoBtn, true);
                };
            }
            if (shareCardBtn) {
                shareCardBtn.onclick = () => handleShareMyCard(liferTotals);
            }
            
            // --- もらったカードのリスナー ---
            const importCardFile = document.getElementById('import-card-file');
            const receivedList = document.getElementById('received-cards-list');

            if (importCardFile) {
                importCardFile.onchange = handleImportReceivedCard;
            }
            if (receivedList) {
                receivedList.onclick = (e) => {
                    const deleteBtn = e.target.closest('[data-action="delete"]');
                    if (deleteBtn) {
                        const cardElement = e.target.closest('[data-card-id]');
                        if (cardElement) {
                            handleDeleteReceivedCard(cardElement.dataset.cardId);
                        }
                    }
                };
            }

            // --- 既存のリスナー ---
            const exportCsvBtn = document.getElementById('export-csv-btn');
            if (exportCsvBtn) {
                exportCsvBtn.onclick = handleExportCsvData; 
            }
            
            const exportBtn = document.getElementById('export-data-btn');
            const importFile = document.getElementById('import-data-file');
            const importBtn = document.getElementById('import-data-btn');

            if (exportBtn) {
                 exportBtn.onclick = handleExportData;
            }
            if (importFile && importBtn) {
                importFile.onchange = () => {
                    if (importFile.files.length > 0) {
                        importBtn.disabled = false;
                        importBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    } else {
                        importBtn.disabled = true;
                        importBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                };
                importBtn.onclick = () => {
                    if (importFile.files.length > 0) {
                        handleImportData(importFile.files[0]);
                    }
                };
            }

            const autoUpdateToggle = document.getElementById('auto-update-lifer-toggle');
            const rescanBtn = document.getElementById('rescan-lifer-btn');
            
            if (autoUpdateToggle) {
                autoUpdateToggle.onclick = () => {
                    appState.settings.autoUpdateLiferList = !appState.settings.autoUpdateLiferList;
                    autoUpdateToggle.classList.toggle('bg-emerald-600', appState.settings.autoUpdateLiferList);
                    autoUpdateToggle.classList.toggle('bg-gray-200', !appState.settings.autoUpdateLiferList);
                    autoUpdateToggle.querySelector('span').classList.toggle('translate-x-6', appState.settings.autoUpdateLiferList);
                    autoUpdateToggle.querySelector('span').classList.toggle('translate-x-1', !appState.settings.autoUpdateLiferList);
                    saveListControlsState(); 
                };
            }
            if (rescanBtn) {
                rescanBtn.onclick = handleRescanLiferList;
            }

            const bgColorPicker = document.getElementById('bg-color-picker');
            const bgImageInput = document.getElementById('bg-image-input');
            const bgRemoveBtn = document.getElementById('bg-remove-image-btn');
            const bgOpacitySlider = document.getElementById('bg-opacity-slider');
            const bgOpacityValue = document.getElementById('bg-opacity-value');

            if (bgColorPicker) {
                bgColorPicker.onchange = (e) => saveBackgroundSettings({ bgColor: e.target.value });
            }
            if (bgOpacitySlider && bgOpacityValue) {
                bgOpacitySlider.oninput = (e) => {
                    bgOpacityValue.textContent = e.target.value;
                    saveBackgroundSettings({ bgOpacity: parseFloat(e.target.value) });
                };
            }
            if (bgRemoveBtn) {
                bgRemoveBtn.onclick = async () => {
                    const confirmed = await showCustomConfirm('背景画像を削除しますか？', '削除');
                    if (confirmed) {
                        saveBackgroundSettings({ bgImage: '' });
                        bgRemoveBtn.classList.add('hidden');
                        if (bgImageInput) bgImageInput.value = null; 
                    }
                };
            }
            if (bgImageInput) {
                bgImageInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { 
                        showCustomConfirm("画像サイズが5MBを超えています。5MB以下のファイルを選択してください。", "OK", true);
                        e.target.value = null;
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        saveBackgroundSettings({ bgImage: event.target.result }); 
                        bgRemoveBtn.classList.remove('hidden');
                    };
                    reader.onerror = (error) => {
                        console.error("File reading error:", error);
                        showCustomConfirm("画像の読み込みに失敗しました。", "OK", true);
                    };
                    reader.readAsDataURL(file);
                };
            }

        } catch (error) {
            console.error("Error setting up settings page listeners:", error);
        }
    }, 0);
}

// --- 背景設定を保存する関数 ---
function saveBackgroundSettings(newSettings) {
    try {
        const defaultSettings = { bgColor: '#f3f4f6', bgImage: '', bgOpacity: 0.1 };
        let settings;
        
        const storedSettings = localStorage.getItem('birdAppBackground');
        settings = storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;

        settings = { ...settings, ...newSettings };
        
        localStorage.setItem('birdAppBackground', JSON.stringify(settings));
        
        applyBackgroundSettings();

    } catch (e) {
        console.error("Failed to save background settings:", e);
    }
}
```eof

### 6. `settings.js` （パート2/2）
（`settings.js` ファイルの残り半分です。パート1のすぐ下に貼り付けてください）

```markdown:settings_js_part2.txt
// --- データのエクスポート処理 ---
async function handleExportData() {
    console.log('データのエクスポートを開始します...');
    
    try {
        const db = await openBirdDB();
        
        const birds = await db.getAll(STORE_BIRDS);
        const events = await db.getAll(STORE_EVENTS);
        // ★★★ もらったカードもエクスポートに含める ★★★
        const receivedCardsData = await db.getAll(STORE_CARDS);
        
        const settings = JSON.parse(localStorage.getItem('birdListControls') || '{}');
        const backgroundSettings = JSON.parse(localStorage.getItem('birdAppBackground') || '{}');
        
        const backupData = {
            birds: birds,
            events: events,
            receivedCards: receivedCardsData, // ★ 追加
            settings: settings, 
            backgroundSettings: backgroundSettings, 
            exportDate: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(backupData); 
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `bird-pokedex-backup-${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('エクスポートが完了しました。');

    } catch (error) {
        console.error('エクスポートに失敗しました:', error);
        await showCustomConfirm(
            `エクスポートに失敗しました。\nエラー: ${error.message}`,
            'OK',
            true 
        );
    }
}


// --- データのインポート処理 ---
async function handleImportData(file) {
    if (!file) return;

    const confirmed = await showCustomConfirm(
        '本当にインポートしますか？\n現在のすべてのデータ（設定含む）は、ファイルの内容で上書きされます。この操作は元に戻せません。',
        'インポート実行'
    );

    const importFile = document.getElementById('import-data-file');
    const importBtn = document.getElementById('import-data-btn');

    if (!confirmed) {
        console.log('インポートがキャンセルされました。');
        if (importFile) importFile.value = null;
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    console.log('インポート処理を開始します...');
    showLoadingMessage("データをインポート中...");

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonString = event.target.result;
            const backupData = JSON.parse(jsonString);

            if (!backupData || !Array.isArray(backupData.birds) || !Array.isArray(backupData.events)) {
                throw new Error('バックアップファイルの形式が無効です。（鳥またはイベントのデータがありません）');
            }

            const db = await openBirdDB();
            await db.clear(STORE_BIRDS);
            await db.clear(STORE_EVENTS);
            // ★★★ もらったカードもクリアする ★★★
            await db.clear(STORE_CARDS);
            
            const birdTx = db.transaction(STORE_BIRDS, 'readwrite');
            await Promise.all(backupData.birds.map(bird => birdTx.store.put(bird)));
            await birdTx.done;
            
            const eventTx = db.transaction(STORE_EVENTS, 'readwrite');
            await Promise.all(backupData.events.map(ev => eventTx.store.put(ev)));
            await eventTx.done;
            
            // ★★★ もらったカードもインポート（古い形式のバックアップファイル対応） ★★★
            if (backupData.receivedCards && Array.isArray(backupData.receivedCards)) {
                 const cardTx = db.transaction(STORE_CARDS, 'readwrite');
                 await Promise.all(backupData.receivedCards.map(card => cardTx.store.put(card)));
                 await cardTx.done;
            }

            if (backupData.settings) {
                localStorage.setItem('birdListControls', JSON.stringify(backupData.settings));
            } else {
                localStorage.removeItem('birdListControls'); 
            }
            
            if (backupData.backgroundSettings) {
                localStorage.setItem('birdAppBackground', JSON.stringify(backupData.backgroundSettings));
            } else {
                localStorage.removeItem('birdAppBackground'); 
            }

            console.log('インポートが完了しました。アプリを再読み込みします...');
            
            await initializeDatabase(); 
            loadListControlsState();    
            
            applyBackgroundSettings(); 
            
            showListPage(); 
            
            if (importFile) importFile.value = null;
            if (importBtn) {
                 importBtn.disabled = true;
                 importBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            await showCustomConfirm(
                'データのインポートが完了しました。',
                'OK',
                true 
            );

        } catch (error) {
            console.error('インポート処理中にエラーが発生しました:', error);
            showListPage(); 
            
            await showCustomConfirm(
                `インポートに失敗しました。\nエラー: ${error.message}\n\nファイルが破損していないか、正しいバックアップファイルか確認してください。`,
                'OK',
                true 
            );
        }
    };
    
    reader.onerror = async (error) => {
        console.error('ファイルの読み込みに失敗しました:', error);
        await showCustomConfirm(
            'ファイルの読み込みに失敗しました。',
            'OK',
            true 
        );
    };

    reader.readAsText(file);
}


// --- 観察記録CSVのエクスポート ---
async function handleExportCsvData() {
    console.log('CSVエクスポート処理を開始します...');
    
    const headers = [
        "EventID", "EventName", "EventDateTime", "EventWeather", "EventLocation", "EventCompanions", "EventMemo",
        "ObservedBirdName", "ObservedCount", "ObservedSeen", "ObservedHeard", "ObservedPhoto", "ObservedVideo"
    ];
    
    const csvData = [headers];
    
    try {
        if (!birdEvents || birdEvents.length === 0) {
            await showCustomConfirm("エクスポートするイベントがありません。", "OK", true);
            return;
        }

        for (const event of birdEvents) {
            const eventBase = [
                event.id || '',
                event.name || '',
                event.dateTime || '',
                event.weather || '',
                event.location || '',
                event.companions || '',
                (event.memo || '').replace(/\n/g, ' '), 
            ];
            
            if (event.observedBirds && event.observedBirds.length > 0) {
                for (const bird of event.observedBirds) {
                    const birdData = [
                        bird.name || '',
                        bird.count || 1,
                        bird.seen || false,
                        bird.heard || false,
                        bird.photo || false,
                        bird.video || false
                    ];
                    csvData.push([...eventBase, ...birdData]);
                }
            } else {
                // 鳥の記録がないイベント
                csvData.push([...eventBase, "", "", "", "", "", ""]);
            }
        }

        const csvString = Papa.unparse(csvData);
        
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); 
        const blob = new Blob([bom, csvString], { type: 'text/csv;charset=utf-8;' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `bird-observations-export-${dateStr}.csv`;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('CSVエクスポートが完了しました。');

    } catch (error) {
        console.error('CSVエクスポートに失敗しました:', error);
        await showCustomConfirm(
            `CSVエクスポートに失敗しました。\nエラー: ${error.message}`,
            'OK',
            true 
        );
    }
}


// --- ライフリスト再集計 ---
async function handleRescanLiferList() {
    const confirmed = await showCustomConfirm(
        'イベント履歴全体からライフリストを再集計しますか？\n（手動でOFFにした項目も、履歴にあればONに更新されます）',
        '再集計を実行'
    );
    if (!confirmed) return;

    console.log('ライフリストの再集計を開始...');
    showLoadingMessage("ライフリストを再集計中...");

    let updatedCount = 0;
    let birdDataNeedsSave = false;

    try {
        for (const event of birdEvents) {
            for (const observedBird of event.observedBirds) {
                const birdInDB = birdDatabase.find(b => b.name === observedBird.name);
                if (birdInDB) {
                    let updated = false;
                    if (observedBird.seen && !birdInDB.lifer_seen) {
                        birdInDB.lifer_seen = true;
                        updated = true;
                    }
                    if (observedBird.heard && !birdInDB.lifer_heard) {
                        birdInDB.lifer_heard = true;
                        updated = true;
                    }
                    if (observedBird.photo && !birdInDB.lifer_photo) {
                        birdInDB.lifer_photo = true;
                        updated = true;
                    }
                    if (observedBird.video && !birdInDB.lifer_video) {
                        birdInDB.lifer_video = true;
                        updated = true;
                    }
                    if(updated) {
                        birdDataNeedsSave = true;
                        updatedCount++;
                    }
                }
            }
        }

        if (birdDataNeedsSave) {
            await saveDatabase();
            console.log(`ライフリストの再集計が完了。${updatedCount}件の鳥データが更新されました。`);
        } else {
            console.log('ライフリストの再集計が完了。更新はありませんでした。');
        }
        
        showSettingsPage();
        
        await showCustomConfirm(
            'ライフリストの再集計が完了しました。',
            'OK',
            true
        );

    } catch (error) {
        console.error('ライフリストの再集計中にエラー:', error);
        showSettingsPage(); 
        await showCustomConfirm(
            `再集計中にエラーが発生しました。\n${error.message}`,
            'OK',
            true
        );
    }
}


// --- ★★★ カードの写真変更ハンドラ ★★★ ---
function handleBirderPhotoChange(event, previewElement, removeBtn, isRemove = false) {
    const placeholder = 'https://placehold.co/150x150/e0e0e0/b0b0b0?text=No+Image';

    if (isRemove) {
        appState.settings.birderPhoto = '';
        previewElement.src = placeholder;
        removeBtn.classList.add('hidden');
        saveListControlsState();
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB 制限
        showCustomConfirm("画像サイズが5MBを超えています。5MB以下のファイルを選択してください。", "OK", true);
        event.target.value = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        appState.settings.birderPhoto = e.target.result; // Base64
        previewElement.src = e.target.result;
        removeBtn.classList.remove('hidden');
        saveListControlsState(); // 変更を即時保存
    };
    reader.onerror = (error) => {
        console.error("File reading error:", error);
        showCustomConfirm("画像の読み込みに失敗しました。", "OK", true);
    };
    reader.readAsDataURL(file);
}

// --- ★★★ カードを共有（またはエクスポート）するハンドラ ★★★ ---
async function handleShareMyCard(liferTotals) {
    const myCardData = {
        type: 'BirdPokedexCard', // データの種類を識別
        name: appState.settings.birderName || '名無しのバーダー',
        photo: appState.settings.birderPhoto || '', // Base64
        totals: liferTotals,
        exportedDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(myCardData);
    // ファイル拡張子を .bcard にする (専用ファイルっぽく)
    const fileName = `birder-card-${(appState.settings.birderName || 'user').replace(/[^a-zA-Z0-9]/g, '_')}.bcard`;
    const file = new File([jsonString], fileName, { type: 'application/json' });

    // 1. Web Share API (navigator.share) が使えるか試す
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: '私のバーダーカード',
                text: `${myCardData.name}さんのバーダーカードです。`,
                files: [file]
            });
            console.log('カードが正常に共有されました。');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('共有エラー:', error);
                // 共有が失敗したら、フォールバックとしてダウンロードを実行
                handleExportMyCardFallback(file);
            } else {
                console.log('共有がキャンセルされました。');
            }
        }
    } else {
        // 2. 共有機能が使えないブラウザ（PCなど）の場合は、ダウンロードにフォールバック
        console.log('Web Share API (Files)非対応。ダウンロードにフォールバックします。');
        handleExportMyCardFallback(file);
    }
}

// --- ★★★ カード共有のフォールバック（ダウンロード） ★★★ ---
function handleExportMyCardFallback(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('カードをファイルとしてダウンロードしました。');
}

// --- ★★★ もらったカードを読み込むハンドラ ★★★ ---
async function handleImportReceivedCard(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const jsonString = e.target.result;
            const cardData = JSON.parse(jsonString);

            // データのバリデーション
            if (!cardData || cardData.type !== 'BirdPokedexCard' || !cardData.totals) {
                throw new Error('これは有効なバーダーカードファイルではありません。');
            }
            
            // スナップショットとして保存（ユニークIDと受信日を追加）
            const newCard = {
                ...cardData,
                id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // ユニークID
                receivedDate: new Date().toISOString()
            };

            // グローバル変数とDBに追加
            receivedCards.push(newCard);
            await saveReceivedCards(); // app.js の関数
            
            console.log('カードを読み込みました:', newCard);
            await showCustomConfirm(
                `${escapeHTML(newCard.name)}さんのカードを読み込みました！`,
                'OK',
                true
            );
            
            // 設定画面を再描画して一覧に反映
            showSettingsPage();

        } catch (error) {
            console.error('カードの読み込みに失敗しました:', error);
            await showCustomConfirm(
                `カードの読み込みに失敗しました。\nエラー: ${error.message}`,
                'OK',
                true
            );
        } finally {
            // ファイル選択をリセット
            event.target.value = null;
        }
    };
    reader.onerror = async () => {
        await showCustomConfirm('ファイルの読み取りに失敗しました。', 'OK', true);
        event.target.value = null;
    };
    reader.readAsText(file);
}

// --- ★★★ もらったカードを削除するハンドラ ★★★ ---
async function handleDeleteReceivedCard(cardId) {
    if (!cardId) return;
    
    const cardIndex = receivedCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        console.error('削除対象のカードが見つかりません。');
        return;
    }
    
    const cardName = receivedCards[cardIndex].name || '（名前なし）';

    const confirmed = await showCustomConfirm(
        `${escapeHTML(cardName)}さんのカードを削除しますか？`,
        '削除'
    );
    
    if (confirmed) {
        receivedCards.splice(cardIndex, 1); // 配列から削除
        await saveReceivedCards(); // DBを更新
        showSettingsPage(); // 画面を再描画
    }
}
```eof