// app.js (トリミング枠の移動修正版)

// --- GitHub Pages URL設定 ---
const GITHUB_CSV_URL = 'https://mjy-mo.github.io/bird-pokedex/bird-list.csv';
const GITHUB_VERSION_URL = 'https://mjy-mo.github.io/bird-pokedex/version.txt';

// --- IndexedDB データベース設定 ---
const DB_NAME = 'BirdPokedexDB';
const DB_VERSION = 3;
const STORE_BIRDS = 'birdDatabase';
const STORE_EVENTS = 'events';
const STORE_CARDS = 'receivedCards';

/**
 * IndexedDB データベースを開き、ストア（テーブル）を作成する
 */
async function openBirdDB() {
    const db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_BIRDS)) {
                db.createObjectStore(STORE_BIRDS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_EVENTS)) {
                db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_CARDS)) {
                db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
            }
        },
    });
    return db;
}

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
                seen: 'any', heard: 'any', photo: 'any', video: 'any'
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
        birderName: '',
        birderPhoto: '',
        socialLinks: {
            hp: '', x: '', bluesky: '', instagram: '', threads: ''
        },
        birderComment: '',
        fontSize: 16
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

// --- データ移行（マイグレーション）関数 ---
function migrateEventData(event) {
    const defaults = {
        id: `event_${Date.now()}`,
        name: '無題のイベント',
        dateTime: '',
        weather: '',
        location: '',
        companions: '',
        observedBirds: [], 
        memo: ''
    };
    return { ...defaults, ...event };
}

function migrateBirdData(bird) {
    const defaults = {
        id: '',
        name: '',
        classification: '',
        size: '',
        special_notes: '',
        habitat_hokkaido: '',
        habitat_honshu: '',
        habitat_shikoku: '',
        habitat_kyushu: '',
        habitat_islands: '',
        type: '',
        season: '',
        rarity: '',
        description: '',
        photo_url: '',
        observed_date: '',
        observed_location: '',
        lastObservedEventId: '',
        voice_url: '',
        lifer_seen: false,
        lifer_heard: false,
        lifer_photo: false,
        lifer_video: false
    };
    return { ...defaults, ...bird };
}

// --- データベース初期化 ---
async function initializeDatabase() {
    let db;
    try {
        db = await openBirdDB();
        
        // 1. イベントデータ
        const storedEvents = await db.getAll(STORE_EVENTS);
        if (storedEvents && Array.isArray(storedEvents)) {
            birdEvents = storedEvents.map(migrateEventData);
        } else {
            birdEvents = [];
        }
        
        // 2. もらったカードデータ
        const storedCards = await db.getAll(STORE_CARDS);
        if (storedCards && Array.isArray(storedCards)) {
            receivedCards = storedCards;
        } else {
            receivedCards = [];
        }

        // 3. 鳥データ
        const storedData = await db.getAll(STORE_BIRDS);
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
            birdDatabase = storedData.map(migrateBirdData);
            console.log(`Loaded ${birdDatabase.length} birds from IndexedDB`);

            if (localStorage.getItem('birdDatabaseLoadError')) {
                console.log('Zombie error flag detected. Removing it because DB is valid.');
                localStorage.removeItem('birdDatabaseLoadError');
            }

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
        receivedCards = [];
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
        
        birdDatabase = newBirdDatabase;
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
                const mergedBird = { ...migrateBirdData(masterBird) };
                LOCAL_COLUMNS.forEach(key => { if (localBird[key] !== undefined) mergedBird[key] = localBird[key]; });
                localDataMap.delete(masterBird.id); 
                return mergedBird;
            } else { 
                return masterBird; 
            }
        });
        localDataMap.forEach(remainingLocalBird => newDatabase.push(remainingLocalBird));
        
        birdDatabase = newDatabase;
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


// --- DB保存 (もらったカード) ---
async function saveReceivedCards() { 
     try { 
        const db = await openBirdDB();
        const tx = db.transaction(STORE_CARDS, 'readwrite');
        
        await tx.store.clear();
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
            settings: appState.settings,
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
    
    const defaultSettings = {
        autoUpdateLiferList: true,
        birderName: '',
        birderPhoto: '',
        socialLinks: {
            hp: '', x: '', bluesky: '', instagram: '', threads: ''
        },
        birderComment: '',
        fontSize: 16 
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
        
        appState.settings = { ...defaultSettings, ...(loadedState.settings || {}) }; 
        
        delete appState.listControls.eventControls; 
        delete appState.listControls.settings;

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


// --- ヘッダー更新 & ★レイアウト幅の自動調整 ---
function updateHeader(mode, title = "鳥図鑑") { 
    try { 
        if (!headerTitle || !backButton || !headerActions || !searchPopup || !filterPopup || !viewPopup || !app || !searchToggleButton || !filterToggleButton || !viewToggleButton || !filterActiveDot) {
            console.error("Header elements not found, skipping update.");
            return;
        }
        
        // --- ★ 修正: 操作対象のIDを変更 (header-container, nav-container) ---
        const layoutElements = [
            document.getElementById('header-container'),
            document.getElementById('app'),
            // document.getElementById('nav-container') // 削除: フッターは広げない
        ];

        // 検索ポップアップなども幅調整対象にするため取得
        const popupElements = [
            document.getElementById('search-popup'),
            document.getElementById('filter-popup'),
            document.getElementById('view-popup')
        ];

        if (mode === 'list') {
            // 図鑑リスト: PCでは全幅 (md:max-w-none)
            layoutElements.forEach(el => {
                if (el) {
                    el.classList.remove('md:max-w-2xl');
                    el.classList.add('md:max-w-none');
                }
            });
            popupElements.forEach(el => {
                if (el) {
                    el.classList.remove('md:max-w-2xl');
                    el.classList.add('md:max-w-none');
                }
            });
        } else {
            // それ以外（詳細、設定、イベント等）: PCでは幅制限 (md:max-w-2xl)
            layoutElements.forEach(el => {
                if (el) {
                    el.classList.remove('md:max-w-none');
                    el.classList.add('md:max-w-2xl');
                }
            });
             popupElements.forEach(el => {
                if (el) {
                    el.classList.remove('md:max-w-none');
                    el.classList.add('md:max-w-2xl');
                }
            });
        }
        // ------------------------------------------

        headerTitle.textContent = title;
        backButton.classList.add('hidden');
        headerActions.classList.add('hidden'); 
        searchPopup.classList.add('hidden'); filterPopup.classList.add('hidden'); viewPopup.classList.add('hidden');
        
        searchToggleButton.classList.remove('active'); filterToggleButton.classList.remove('active'); viewToggleButton.classList.remove('active');
        filterActiveDot.classList.add('hidden');

        if (mode === 'list') {
            headerActions.classList.remove('hidden'); 
            if (getFilterStatus().isFiltered) filterActiveDot.classList.remove('hidden');
            const { activePopup } = appState.listControls;
            if (activePopup === 'search') { searchToggleButton.classList.add('active'); searchPopup.classList.remove('hidden'); renderSearchPopup(); } 
            else if (activePopup === 'filter') { filterToggleButton.classList.add('active'); filterPopup.classList.remove('hidden'); renderFilterPopup(); } 
            else if (activePopup === 'view') { viewToggleButton.classList.add('active'); viewPopup.classList.remove('hidden'); renderViewPopup(); }
        
        } else if (mode === 'events' || mode === 'manual' || mode === 'settings') {
             // (何もしない)
        
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

        // タブ切り替え時などにボタンのスタイルが残るのを防ぐためリセット
        if (mode !== 'list') {
            const activeBtnClasses = ['bg-emerald-100', 'text-emerald-700', 'fill-current'];
            [searchToggleButton, filterToggleButton, viewToggleButton].forEach(btn => {
                if (btn) {
                    btn.classList.remove(...activeBtnClasses);
                    btn.classList.add('text-gray-600');
                }
            });
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

    const clickedHeaderButton = event.target.closest('.header-action-button');
    const clickedInsidePopup = event.target.closest('.popup-panel');
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

function applyFontSize(size) {
    const html = document.documentElement;
    html.style.fontSize = `${size}px`;
    if (appState.settings.fontSize !== size) {
        appState.settings.fontSize = size;
        saveListControlsState();
    }
}

// --- 背景設定 ---
function applyBackgroundSettings() {
    const defaultSettings = {
        bgColor: '#f3f4f6', 
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

// --- データ不整合を解消するお掃除関数 ---
async function rescanLatestEventForBirds(birdNames) {
    let birdDataNeedsSave = false;
    const birdNameSet = new Set(birdNames); 

    console.log(`[Rescan] ${birdNameSet.size}羽の鳥の最新イベントを再スキャンします...`);

    for (const birdName of birdNameSet) {
        const birdInDB = birdDatabase.find(b => b.name === birdName);
        if (!birdInDB) continue;

        let newLatestEvent = null;
        let latestDate = ''; 

        for (const event of birdEvents) { 
            const isBirdInEvent = event.observedBirds.some(b => b.name === birdName);
            
            if (isBirdInEvent) {
                if (event.dateTime && event.dateTime > latestDate) {
                    latestDate = event.dateTime;
                    newLatestEvent = event;
                }
            }
        }

        if (newLatestEvent) {
            if (birdInDB.lastObservedEventId !== newLatestEvent.id) {
                birdInDB.lastObservedEventId = newLatestEvent.id;
                birdInDB.observed_date = newLatestEvent.dateTime;
                birdInDB.observed_location = newLatestEvent.location;
                birdDataNeedsSave = true;
                console.log(`[Rescan] ${birdName}: 最新イベントを ${newLatestEvent.name} に更新`);
            }
        } else {
            if (birdInDB.lastObservedEventId !== null && birdInDB.lastObservedEventId !== '') {
                birdInDB.lastObservedEventId = ''; 
                birdInDB.observed_date = '';
                birdInDB.observed_location = '';
                birdDataNeedsSave = true;
                console.log(`[Rescan] ${birdName}: 観察記録が見つからないためリセット`);
            }
        }
    }

    if (birdDataNeedsSave) {
        await saveDatabase(); 
        console.log('[Rescan] 図鑑DBの更新が完了しました。');
    }
}


// --- Cropper.js のモーダル制御 ---
let cropperInstance = null; 

function showCropperModal(imageUrl, onSave, onDelete = null) { 
    const existingModal = document.getElementById('cropper-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }

    const modal = document.createElement('div');
    modal.id = 'cropper-modal';
    modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-75 p-4';
    
    const deleteBtnHtml = onDelete 
        ? `<button id="cropper-delete-btn" class="text-red-500 hover:text-red-400 font-bold px-4 py-2">写真を削除</button>` 
        : '';

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-800">画像のトリミング</h3>
                <button id="cropper-cancel-btn" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="flex-grow relative bg-gray-100 h-96 sm:h-[500px]">
                <img id="cropper-image" src="${imageUrl}" class="max-w-full max-h-full block" style="opacity: 0;"> 
            </div>
            <div class="p-4 border-t border-gray-200 flex justify-between items-center">
                <div>${deleteBtnHtml}</div>
                <button id="cropper-save-btn" class="bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-emerald-700 transition-colors">
                    保存する
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const image = document.getElementById('cropper-image');
    let cropper = null;

    image.onload = () => {
        image.style.opacity = 1;
        cropper = new Cropper(image, {
            aspectRatio: NaN, 
            viewMode: 1,    
            dragMode: 'move',
            autoCropArea: 0.9, // 修正：少し余裕を持たせる
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true, // 修正：true (移動可能)
            cropBoxResizable: true, // 修正：true (リサイズ可能)
            toggleDragModeOnDblclick: false,
        });
    };
    
    const cancelBtn = document.getElementById('cropper-cancel-btn');
    cancelBtn.onclick = () => {
        document.body.removeChild(modal);
    };
    
    if (onDelete) {
        const deleteBtn = document.getElementById('cropper-delete-btn');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                const confirmed = await showCustomConfirm('本当にこの写真を削除しますか？', '削除');
                if (confirmed) {
                    onDelete();
                    document.body.removeChild(modal);
                }
            };
        }
    }

    const saveCroppedBtn = document.getElementById('cropper-save-btn');
    saveCroppedBtn.onclick = () => {
        if (!cropper) return;
        
        const canvas = cropper.getCroppedCanvas({
            maxWidth: 1024,   
            maxHeight: 1024,
            fillColor: '#fff', 
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.85); // 圧縮率0.85
        
        if (onSave) {
            onSave(base64Image);
        }
        
        document.body.removeChild(modal);
    };
}

// --- カスタム確認モーダル（クッション） ---
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

// --- ★修正: ヘッダーボタン連動 ---
function setupHeaderActions() {
    const actions = [
        { btnId: 'search-toggle-button', popupName: 'search' },
        { btnId: 'filter-toggle-button', popupName: 'filter' },
        { btnId: 'view-toggle-button', popupName: 'view' }
    ];
    actions.forEach(({ btnId, popupName }) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                togglePopup(popupName);
            };
        }
    });
}

// --- ★修正: タブ切り替え ---
function setupTabs() {
    const tabs = [
        { id: 'tab-pokedex', page: showListPage },
        { id: 'tab-events', page: showEventsPage },
        { id: 'tab-manual', page: showManualPage },
        { id: 'tab-settings', page: showSettingsPage }
    ];
    tabs.forEach(tab => {
        const button = document.getElementById(tab.id);
            if (button) {
                button.addEventListener('click', (e) => {
                    // window.scrollTo(0, 0) で標準スクロール位置をリセット
                    window.scrollTo(0, 0);

                    // ★追加: アプリ表示領域(app)のスクロールを一番上に戻す
                    const appContainer = document.getElementById('app');
                    if (appContainer) appContainer.scrollTop = 0;

                    tabs.forEach(t => {
                        const btn = document.getElementById(t.id);
                    if (btn) {
                        btn.classList.remove('tab-active');
                        btn.classList.add('tab-inactive');
                    }
                });
                if (e.currentTarget) {
                    e.currentTarget.classList.remove('tab-inactive');
                    e.currentTarget.classList.add('tab-active');
                }

                // ポップアップを閉じる
                appState.listControls.activePopup = null;
                // updateHeader でモードを渡してレイアウト制御させる
                updateHeader(tab.id === 'tab-pokedex' ? 'list' : 'other');

                tab.page();
            });
        }
    });
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDatabase();
        loadListControlsState();
        showListPage();
        applyBackgroundSettings();
        setupTabs(); 
        setupHeaderActions(); 
        if (appState.settings.fontSize) applyFontSize(appState.settings.fontSize);
        document.body.addEventListener('click', closePopupsOnMainTap);
    } catch (e) {
        console.error("App initialization failed:", e);
        const app = document.getElementById('app');
        if (app) app.innerHTML = `<div class="p-4 text-red-600 font-bold">アプリの起動に失敗しました。<br>${e.message}</div>`;
    }
});