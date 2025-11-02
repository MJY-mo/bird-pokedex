// --- GitHub Pages URL設定 ---
const GITHUB_CSV_URL = 'https://mjy-mo.github.io/bird-pokedex/bird-list.csv';
const GITHUB_VERSION_URL = 'https://mjy-mo.github.io/bird-pokedex/version.txt';


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
let currentEventIndex = -1; // イベントの編集中/表示中のインデックス

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
        },
        viewMode: 'tile', activePopup: null, openFilterSection: null, 
        currentPage: 1, itemsPerPage: 30, 
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
        'description', 'photo_url', 'observed_date', 'observed_location'
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
];

// --- データベース初期化 ---
async function initializeDatabase() {
    const storedEvents = localStorage.getItem('birdEvents');
    if (storedEvents) {
        try {
            birdEvents = JSON.parse(storedEvents);
            if (!Array.isArray(birdEvents)) throw new Error("Parsed event data is not an array"); 
        } catch(e) {
            console.error("Failed to parse event data, resetting:", e);
            localStorage.setItem('birdDatabaseLoadError', 'true'); 
            localStorage.removeItem('birdEvents'); 
            birdEvents = [];
        }
    } else {
        birdEvents = [];
    }
    
    const storedData = localStorage.getItem('birdDatabase');
    if (storedData) {
        try {
            birdDatabase = JSON.parse(storedData);
            if (!Array.isArray(birdDatabase)) throw new Error("Parsed bird database is not an array"); 
            console.log('Loaded data from localStorage');
            // ★ ローカルデータがある場合は、差分更新チェック（自動同期）
            await checkAndUpdateData(); 
        } catch(e) {
            console.error("Failed to parse bird database, resetting:", e);
            localStorage.setItem('birdDatabaseLoadError', 'true'); 
            localStorage.removeItem('birdDatabase'); 
            birdDatabase = [];
        }
    } else {
        birdDatabase = [];
        console.log('No bird data found. Fetching initial data...');
        // ★ 修正: ローカルデータがない場合（初回起動など）は、フル同期を試みる（自動同期）
        if (!GITHUB_CSV_URL.includes('[YOUR_USERNAME]')) {
             await fetchCSVAndSave(); // これで初回データが入る
        }
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
        // (★変更) エラーがあっても、設定画面からの手動同期なら実行を許可
        // return; 
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
        saveDatabase(); 
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
        
        birdDatabase = newDatabase; 
        updateAllOrdersList();
        saveDatabase(); 
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

// --- DB保存 ---
function saveDatabase() { 
     try { 
        localStorage.setItem('birdDatabase', JSON.stringify(birdDatabase)); 
        localStorage.removeItem('birdDatabaseLoadError'); 
    } 
    catch (e) { 
        console.error('Failed to save database to localStorage:', e); 
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
    }
}
function saveEventsData() { 
     try { 
        localStorage.setItem('birdEvents', JSON.stringify(birdEvents)); 
        localStorage.removeItem('birdDatabaseLoadError'); 
     } 
     catch (e) { 
        console.error('Failed to save events to localStorage:', e); 
        localStorage.setItem('birdDatabaseLoadError', 'true'); 
     }
}

// --- 状態保存 (リスト制御) ---
function saveListControlsState() { 
    try {
        const stateToSave = { ...appState.listControls, currentPage: 1 };
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
    
    const defaultFilters = {
        season: [...defaultSeasons], type: [...filterableTypes], habitat: habitatKeys.map(h => h.key),
        size: Object.keys(sizeRanges), classification: { orders: defaultClassificationOrders, family: null }, 
        edited: 'all',
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
            season: loadedFilters.season || [...defaultSeasons]
        };
        delete loadedState.filters.photo;
        appState.listControls = { ...appState.listControls, ...loadedState };
    } else {
        defaultFilters.classification.orders = defaultClassificationOrders; 
        appState.listControls.filters = defaultFilters;
    }
}

// --- 絞り込み状態チェック ---
function getFilterStatus() { 
    const { filterText, filters } = appState.listControls;
    if (!filters || !filters.classification) {
        console.warn("getFilterStatus: filters or filters.classification is undefined.");
        return { isFiltered: false }; 
    }
    const isTextFiltered = (filterText || '').length > 0;
    const isSeasonFiltered = (filters.season || []).length !== filterableSeasons.length; 
    const isTypeFiltered = (filters.type || []).length !== filterableTypes.length;
    const isHabitatFiltered = (filters.habitat || []).length !== habitatKeys.length;
    const isSizeFiltered = (filters.size || []).length !== Object.keys(sizeRanges).length;
    const isClassificationFiltered = (filters.classification.orders || []).length !== allOrders.length;
    const isEditedFiltered = filters.edited !== 'all'; 
    const isFiltered = isTextFiltered || isSeasonFiltered || isTypeFiltered || isHabitatFiltered || isSizeFiltered || isClassificationFiltered || isEditedFiltered; 
    
    return { isFiltered, isTextFiltered, isSeasonFiltered, isTypeFiltered, isHabitatFiltered, isSizeFiltered, isClassificationFiltered, isEditedFiltered };
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
                 // (★変更) イベント詳細から戻る際に保存
                 if (mode === 'eventDetail') {
                     saveEventsData(); 
                 }
                 showEventsPage(); 
             };
        } else if (mode === 'error' || mode === 'loading') {
            // エラー・ローディング中はボタンなどを表示しない
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

// --- アプリケーション初期化 ---
document.addEventListener('DOMContentLoaded', async () => { 
    try { 
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
        app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">アプリ起動エラー</strong><span class="block sm:inline">アプリの起動に失敗しました。</span><p class="mt-2">開発者コンソール(F12)で詳細を確認してください。</p></div>`;
        try { updateHeader('error', 'エラー'); } catch(e) { console.error("Failed to update header on error:", e); } 
    }
});

