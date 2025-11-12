// ★ 機能追加: イベントリストの1ページあたりの表示件数
const EVENT_ITEMS_PER_PAGE = 10;

// --- イベントリスト画面 ---
function showEventsPage() { 
    appState.currentPage = 'events'; appState.isEditing = false;
    
    // 日本語ソート用のコレーター
    const jaCollator = new Intl.Collator('ja');
    
    // --- ★ 機能追加: 検索フィルターのUI ---
    const filterOptions = [
        { value: 'any', label: '確認方法 (すべて)' },
        { value: 'seen', label: '目視' },
        { value: 'heard', label: '声' },
        { value: 'photo', label: '写真' },
        { value: 'video', label: '動画' }
    ];
    const currentFilterName = appState.eventControls.filterBirdName;
    const currentFilterType = appState.eventControls.filterObservedType;
    
    const searchHtmlContent = `
        <div class="p-4 space-y-3"> <div>
// (35行目)
                <label for="event-filter-name" class="block text-sm font-medium text-gray-700">観察した鳥</label>
                <input type="search" id="event-filter-name" value="${escapeHTML(currentFilterName)}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: スズメ">
            </div>
            <div>
// (40行目)
                <label for="event-filter-type" class="block text-sm font-medium text-gray-700">確認方法</label>
                <select id="event-filter-type" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                    ${filterOptions.map(opt => 
                        `<option value="${opt.value}" ${opt.value === currentFilterType ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="flex space-x-2 pt-2">
// (48行目)
                <button id="event-search-button" class="flex-1 bg-yellow-500 text-gray-800 font-bold py-2 px-4 rounded-lg shadow hover:bg-yellow-600">検索</button>
                <button id="event-clear-button" class="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg shadow hover:bg-gray-300">クリア</button>
            </div>
        </div>
    `;
    
    // --- 並び替えUI ---
    const sortOptions = [
        { value: 'dateTime_desc', label: '日時 (新しい順)' },
        { value: 'dateTime_asc', label: '日時 (古い順)' },
        { value: 'name_asc', label: '名前 (昇順)' },
        { value: 'name_desc', label: '名前 (降順)' }
    ];
    const sortKey = appState.eventControls.listSort;
    const sortSelectHtml = `
        <div class="mt-4">
            <label for="event-list-sort" class="block text-sm font-medium text-gray-500 mb-1">並び替え</label>
            <select id="event-list-sort" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                ${sortOptions.map(opt => 
                    `<option value="${opt.value}" ${opt.value === sortKey ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
            </select>
        </div>
    `;

    // --- ★ 機能追加: フィルターロジック ---
    const hiraganaFilter = toHiragana(currentFilterName);
    const typeFilter = currentFilterType;
    
    const filteredEvents = birdEvents.filter(event => {
        // フィルターが両方とも「なし」なら、すべて通す
        if (!hiraganaFilter && typeFilter === 'any') {
            return true;
        }
        
        // event.observedBirds の中に、条件に合う鳥が1羽でもいるか探す
        return event.observedBirds.some(bird => {
            // 1. 名前の条件
            const nameMatch = !hiraganaFilter ? true : toHiragana(bird.name).includes(hiraganaFilter);
            // 2. タイプの条件
            const typeMatch = typeFilter === 'any' ? true : bird[typeFilter] === true;
            
            // 両方の条件を満たす場合に true
            return nameMatch && typeMatch;
        });
    });

    // --- 並び替えロジック (フィルター済みのリストに適用) ---
    let sortedEvents = [...filteredEvents];
    switch (sortKey) {
        case 'dateTime_asc':
            sortedEvents.sort((a,b) => (a.dateTime || '').localeCompare(b.dateTime || ''));
            break;
        case 'name_asc':
            sortedEvents.sort((a, b) => jaCollator.compare(a.name || '', b.name || ''));
            break;
        case 'name_desc':
            sortedEvents.sort((a, b) => jaCollator.compare(b.name || '', a.name || ''));
            break;
        case 'dateTime_desc':
        default:
            sortedEvents.sort((a,b) => (b.dateTime || '').localeCompare(a.dateTime || ''));
            break;
    }
    
    // --- ★ 機能追加: ページネーションロジック ---
    const totalItems = sortedEvents.length;
    const totalPages = Math.ceil(totalItems / EVENT_ITEMS_PER_PAGE);
    let currentPage = appState.eventControls.currentPage;
    if (currentPage < 1) currentPage = 1; 
    else if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    appState.eventControls.currentPage = currentPage; // 補正したページ番号をstateに反映

    const startIndex = (currentPage - 1) * EVENT_ITEMS_PER_PAGE;
    const endIndex = startIndex + EVENT_ITEMS_PER_PAGE;
    const paginatedEvents = sortedEvents.slice(startIndex, endIndex);

    // --- リストHTML生成 (ページネーション適用済み) ---
    const formatDate = (dateStr) => { 
        if (!dateStr) return '日時未設定';
        try {
            const date = new Date(dateStr.replace(' ', 'T') + ':00'); 
            if (isNaN(date)) return dateStr; 
            return date.toLocaleDateString('ja-JP'); 
        } catch { return dateStr; }
    }; 
    let listHtml = paginatedEvents.length === 0 ? 
        (currentFilterName ? '<p class="text-gray-500 text-center py-4">検索条件に合うイベントはありません。</p>' : '<p class="text-gray-500 text-center py-4">記録されたイベントはありません。</p>') 
        : 
        paginatedEvents.map((ev) => {
            const originalIndex = birdEvents.findIndex(e => e.id === ev.id); 
            if (originalIndex === -1) return ''; 
            // ★ 修正: イベント削除ボタンを追加
            return `<div class="p-4 border-b border-gray-200 flex justify-between items-center">
                        <div class="flex-1 cursor-pointer hover:bg-gray-50 -ml-4 -my-4 pl-4 py-4" data-index="${originalIndex}" data-action="view"> <h3 class="font-semibold text-gray-800">${escapeHTML(ev.name || '無題のイベント')}</h3>
                            <p class="text-sm text-gray-500">${escapeHTML(formatDate(ev.dateTime))}</p>
                        </div>
                        <button type="button" data-index="${originalIndex}" data-action="delete" class="event-delete-btn text-red-400 hover:text-red-600 p-2 rounded-lg -mr-2 flex-shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>`;
        }).join('');
        
     // --- 画面全体の描画 ---
     // ★★★ 修正点: 外側のdivに p-2 を追加 ★★★
     const searchAccordionHtml = `
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <button id="accordion-toggle-search" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                <h2 class="text-xl font-semibold text-gray-800">イベント検索</h2>
                <svg id="accordion-arrow-search" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id="accordion-content-search" class="accordion-content" style="max-height: 0px;">
                <div class="border-t border-gray-100">
                    ${searchHtmlContent} </div>
            </div>
        </div>
     `;

     app.innerHTML = `
        <div class="space-y-4 p-2">
             <button id="newEventButton" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">新規イベント作成</button>
             ${searchAccordionHtml} ${sortSelectHtml} <div class="bg-white rounded-lg shadow overflow-hidden">

                <h2 class="text-xl font-semibold p-4 border-b border-gray-200">イベント履歴</h2>
                <div id="event-list">${listHtml}</div>
             </div>
             <div id="event-pagination-controls" class="mt-6 flex justify-between items-center"></div>
        </div>`;
    updateHeader('events', 'イベント');

    // ★ ページネーションUIを描画
    renderEventPaginationControls(totalItems, totalPages);

    // --- リスナー設定 ---
    setTimeout(() => {
        const newEventBtn = document.getElementById('newEventButton');
        if (newEventBtn) {
// (185行目)
            newEventBtn.onclick = showNewEventForm; 
        } else {
            console.error("New event button not found");
        }
        
        // ★★★ ここから追加 ★★★
        const searchAccordionToggle = document.getElementById('accordion-toggle-search');
        if (searchAccordionToggle) {
            // events.js の 597行目にある toggleAccordion 関数を呼び出す
            searchAccordionToggle.onclick = () => toggleAccordion('accordion-content-search', 'accordion-arrow-search');
        }
        // ★★★ 追加ここまで ★★★
        
        const sortSelect = document.getElementById('event-list-sort');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                appState.eventControls.listSort = e.target.value;
                appState.eventControls.currentPage = 1; // ソート変更時は1ページ目に戻る
                saveListControlsState(); 
                showEventsPage(); 
            });
        }
        
        // ★ 機能追加: 検索ボタンのリスナー
        const searchBtn = document.getElementById('event-search-button');
        if (searchBtn) {
            searchBtn.onclick = () => {
                const nameInput = document.getElementById('event-filter-name');
                const typeInput = document.getElementById('event-filter-type');
                
                appState.eventControls.filterBirdName = nameInput.value;
                appState.eventControls.filterObservedType = typeInput.value;
                appState.eventControls.currentPage = 1; // 検索時は1ページ目に戻る
                
                saveListControlsState();
                showEventsPage();
            };
        }
        
        // ★ 機能追加: クリアボタンのリスナー
        const clearBtn = document.getElementById('event-clear-button');
        if (clearBtn) {
            clearBtn.onclick = () => {
                appState.eventControls.filterBirdName = '';
                appState.eventControls.filterObservedType = 'any';
                appState.eventControls.currentPage = 1; 
                
                saveListControlsState();
                showEventsPage();
            };
        }
        
        // ★ 修正: イベントリストのクリック処理（イベント委任）
        const eventList = document.getElementById('event-list');
        if (eventList) {
            eventList.addEventListener('click', (e) => {
                const actionTarget = e.target.closest('[data-action]');
                if (!actionTarget) return;

                const action = actionTarget.dataset.action;
                const index = parseInt(actionTarget.dataset.index, 10);

                if (isNaN(index)) return;

                if (action === 'view') {
                    showEventDetail(index);
                } else if (action === 'delete') {
                    handleDeleteEvent(index); // ★ 新しい削除関数を呼ぶ
                }
            });
        }
        
    }, 0);
}

// --- 新規イベント作成画面 ---
function showNewEventForm() { 
    appState.currentPage = 'newEvent'; 
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    const defaultDateTime = now.toISOString().slice(0, 16);
    
    let newEventData = { 
        id: Date.now().toString(), 
        name: '', 
        dateTime: defaultDateTime, 
        weather: '', 
        location: '', 
        companions: '', 
        observedBirds: [],
        memo: '' 
    };
    
    // ★★★ 修正点: 外側のdivに p-2 を追加 ★★★
    app.innerHTML = `
    <form id="newEventForm" class="bg-white rounded-lg shadow p-4 space-y-4 p-2">
        <h2 class="text-xl font-bold text-gray-900 mb-2">新規イベント作成</h2>
        <div class="space-y-3">
            <div>
                <label for="event_name" class="block text-sm font-medium text-gray-700">イベント名</label>
                <input type="text" id="event_name" name="name" value="${escapeHTML(newEventData.name)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 週末の探鳥会">
            </div>
            <div>
                <label for="event_datetime" class="block text-sm font-medium text-gray-700">日時</label>
                <input type="datetime-local" id="event_datetime" name="dateTime" value="${defaultDateTime}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
            </div>
            <div>
                <label for="event_weather" class="block text-sm font-medium text-gray-700">天気</label>
                <input type="text" id="event_weather" name="weather" value="${escapeHTML(newEventData.weather)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 晴れ">
            </div>
            <div>
                <label for="event_location" class="block text-sm font-medium text-gray-700">場所</label>
                <input type="text" id="event_location" name="location" value="${escapeHTML(newEventData.location)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 〇〇公園">
            </div>
            <div>
                <label for="event_companions" class="block text-sm font-medium text-gray-700">同行者</label>
                <input type="text" id="event_companions" name="companions" value="${escapeHTML(newEventData.companions)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: Aさん, Bさん">
            </div>
        </div>
        <hr class="my-4">

        <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
            イベントを作成
        </button>

    </form>`;
    
    updateHeader('newEvent', '新規イベント');
    
    setTimeout(() => {
        setupNewEventFormListeners(newEventData); 
    }, 0);
}

function setupNewEventFormListeners(eventData) { 
    const form = document.getElementById('newEventForm'); 
    if (!form) {
        console.error("New event form not found");
        return; 
    }
    
    form.querySelectorAll('.event-input').forEach(input => {
        input.addEventListener('input', (e) => { 
            if (eventData) {
                eventData[e.target.name] = e.target.value; 
            }
        });
    });
    
    form.onsubmit = (e) => {
        e.preventDefault(); 
        
        const formData = new FormData(form);
        const finalEventData = {
            ...eventData,
            name: formData.get('name') || '無題のイベント',
            dateTime: formData.get('dateTime'),
            weather: formData.get('weather'),
            location: formData.get('location'),
            companions: formData.get('companions'),
            memo: '', 
        };

        handleSaveNewEvent(finalEventData); 
    };
}

function renderEventBirdSuggestions(suggestions) { 
    const box = document.getElementById('bird_name_suggestions'); 
    if (!box) return;
    if (suggestions.length === 0) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    
    box.classList.remove('hidden');
    box.innerHTML = suggestions.map(n => 
        `<div class="event-suggestion-item" data-name="${escapeHTML(n)}">${escapeHTML(n)}</div>`
    ).join('');
    
    setTimeout(() => {
        box.querySelectorAll('.event-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const nameInput = document.getElementById('bird_name_input');
                if (nameInput) nameInput.value = item.dataset.name; 
                box.classList.add('hidden'); 
            });
        });
    }, 0);
}

// --- イベント鳥リストテーブル描画 ---
function renderObservedBirdsTable() { 
    const event = birdEvents[currentEventIndex]; 
    if (!event) return '<tr><td colspan="5" class="text-center text-gray-500 py-4">エラー: イベントが見つかりません。</td></tr>';
    
    const jaCollator = new Intl.Collator('ja');
    const sortKey = appState.eventControls.detailSort;
    let sortedBirds = [...event.observedBirds]; 
    
    // ★★★ 修正点: レア度ソートのためのヘルパー関数 ★★★
    // (pokedex.js からロジックを拝借)
    const getRarityNum = (rarity) => { const r = parseInt(rarity, 10); return isNaN(r) ? 99 : r; };
    const getBirdRarity = (birdName) => {
        // birdDatabase は app.js で定義されたグローバル変数
        const birdInDB = birdDatabase.find(b => b.name === birdName);
        return birdInDB ? birdInDB.rarity : '';
    };
    
    switch(sortKey) {
        case 'name_asc':
            sortedBirds.sort((a, b) => jaCollator.compare(a.name || '', b.name || ''));
            break;
        case 'type_seen':
            sortedBirds.sort((a, b) => (b.seen ? 1 : 0) - (a.seen ? 1 : 0));
            break;
        case 'type_heard':
            sortedBirds.sort((a, b) => (b.heard ? 1 : 0) - (a.heard ? 1 : 0));
            break;
        case 'type_photo':
            sortedBirds.sort((a, b) => (b.photo ? 1 : 0) - (a.photo ? 1 : 0));
            break;
        case 'type_video':
            sortedBirds.sort((a, b) => (b.video ? 1 : 0) - (a.video ? 1 : 0));
            break;
        // ★★★ 修正点: レア度ソートを追加 ★★★
        case 'rarity_asc':
            sortedBirds.sort((a, b) => getRarityNum(getBirdRarity(a.name)) - getRarityNum(getBirdRarity(b.name)));
            break;
        case 'rarity_desc':
            sortedBirds.sort((a, b) => getRarityNum(getBirdRarity(b.name)) - getRarityNum(getBirdRarity(a.name)));
            break;
        case 'added_asc':
        default:
            break;
    }
    
     if (sortedBirds.length === 0) {
         return '<tr><td colspan="5" class="text-center text-gray-500 py-4">まだ鳥が追加されていません。</td></tr>';
     }
     
     const iconSeen = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
     // ★ 修正: スピーカーアイコンに変更 (Heroicons: speaker-wave)
     const iconHeard = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"></path></svg>`;
     const iconPhoto = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
     const iconVideo = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 5h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>`;

     return sortedBirds.map((b) => {
         const originalBirdIndex = event.observedBirds.findIndex(ob => ob === b);
         
         return `
        <tr class="text-sm border-b border-gray-100 last:border-b-0">
            <td class="px-4 py-3 font-medium text-gray-900">${escapeHTML(b.name)}</td>
            <td class="px-2 py-3 text-gray-500 text-center">${b.count}</td>
            <td class="px-2 py-3 text-gray-500">
                <div class="flex items-center justify-center space-x-1">
                    ${b.seen ? `<span title="目視">${iconSeen}</span>` : ''}
                    ${b.heard ? `<span title="声">${iconHeard}</span>` : ''}
                    ${b.photo ? `<span title="写真">${iconPhoto}</span>` : ''}
                    ${b.video ? `<span title="動画">${iconVideo}</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-3 text-right">
                <button type="button" class="remove-bird-btn text-red-500 hover:text-red-700 text-xs font-medium" data-index="${originalBirdIndex}">
                    削除
                </button>
            </td>
        </tr>`
     }).join('');
} 

// --- 新規イベント保存 ---
function handleSaveNewEvent(eventData) { 
    if (!eventData) return;
    birdEvents.push({ ...eventData, observedBirds: [] }); 
    saveEventsData(); 
    currentEventIndex = -1; 
    showEventsPage(); 
}

// --- イベント詳細表示 ---
function showEventDetail(originalIndex) { 
     const event = birdEvents[originalIndex]; if (!event) return;
     appState.currentPage = 'eventDetail'; 
     currentEventIndex = originalIndex; 
     
     if (event.memo === undefined) event.memo = '';
     
     const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
     const defaultDateTime = now.toISOString().slice(0, 16);


     const details = [
         // ★ 修正: 「イベント名」の編集欄を追加
         { label: 'イベント名', name: 'name', value: event.name || '', type: 'text', placeholder: '例: 週末の探鳥会' },
         { label: '日時', name: 'dateTime', value: event.dateTime || '', type: 'datetime-local', placeholder: defaultDateTime },
         { label: '天気', name: 'weather', value: event.weather || '', type: 'text', placeholder: '例: 晴れ' },
         { label: '場所', name: 'location', value: event.location || '', type: 'text', placeholder: '例: 〇〇公園' },
         { label: '同行者', name: 'companions', value: event.companions || '', type: 'text', placeholder: '例: Aさん' },
     ];
     
     // --- 1. 基本情報アコーディオン ---
     const eventDetailsHtml = `
        <div class="bg-white rounded-lg shadow">
            <button id="event-accordion-toggle" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold text-gray-800">基本情報</h3>
                <svg id="event-accordion-arrow" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <div id="event-accordion-content" class="accordion-content" style="max-height: 0px;">
                <dl id="event-details-view" class="p-4 border-t border-gray-200 space-y-3">
                    ${details.map(d => `
                        <div>
                            <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                            <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value) || '(未設定)'}</dd>
                        </div>
                    `).join('')}
                    <div class="pt-2">
                        <button id="edit-event-btn" class="text-sm font-medium text-emerald-600 hover:text-emerald-800">編集</button>
                    </div>
                </dl>
                
                <form id="event-details-edit-form" class="p-4 border-t border-gray-200 space-y-4 hidden">
                    ${details.map(d => `
                        <div>
                            <label for="edit_${d.name}" class="block text-sm font-medium text-gray-700">${d.label}</label>
                            <input type="${d.type}" id="edit_${d.name}" name="${d.name}" 
                                   value="${escapeHTML(d.value)}" 
                                   placeholder="${escapeHTML(d.placeholder)}"
                                   class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                    `).join('')}
                    <div class="flex space-x-2">
                        <button type="submit" id="save-event-btn" class="flex-1 bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-700">保存</button>
                        <button type="button" id="cancel-edit-event-btn" class="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg shadow hover:bg-gray-300">中止</button>
                    </div>
                </form>
            </div>
        </div>`;
     
     // --- 2. 鳥追加アコーディオン ---
     const iconSeen = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
     // ★ 修正: スピーカーアイコンに変更 (Heroicons: speaker-wave)
     const iconHeard = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"></path></svg>`;
     const iconPhoto = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
     const iconVideo = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 5h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>`;
     
     const addBirdFormHtml = `
        <div class="bg-white rounded-lg shadow">
            <button id="add-bird-accordion-toggle" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold text-gray-800">観察した鳥を追加</h3>
                <svg id="add-bird-accordion-arrow" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id="add-bird-accordion-content" class="accordion-content" style="max-height: 0px;">
                <div class="p-4 border-t border-gray-200 space-y-3">
                    <div class="relative">
                        <label for="bird_name_input" class="block text-sm font-medium text-gray-700">鳥の名前</label>
                        <input type="text" id="bird_name_input" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="名前を入力..." autocomplete="off">
                        <div id="bird_name_suggestions" class="event-suggestion-list hidden"></div>
                    </div>
                    <div class="flex items-center space-x-4">
                         <div>
                            <label for="bird_count_input" class="block text-sm font-medium text-gray-700">数</label>
                            <input type="number" id="bird_count_input" value="1" min="1" class="mt-1 block w-20 border border-gray-300 rounded-md shadow-sm px-3 py-1.5 focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                        <div class="flex items-center space-x-3 pt-5 flex-wrap gap-2">
                            <label class="flex items-center space-x-1.5"><input type="checkbox" id="bird_seen_input" class="form-checkbox text-emerald-600 rounded">${iconSeen}<span>目視</span></label>
                            <label class="flex items-center space-x-1.5"><input type="checkbox" id="bird_heard_input" class="form-checkbox text-emerald-600 rounded">${iconHeard}<span>声</span></label>
                            <label class="flex items-center space-x-1.5"><input type="checkbox" id="bird_photo_input" class="form-checkbox text-emerald-600 rounded">${iconPhoto}<span>写真</span></label>
                            <label class="flex items-center space-x-1.5"><input type="checkbox" id="bird_video_input" class="form-checkbox text-emerald-600 rounded">${iconVideo}<span>動画</span></label>
                        </div>
                    </div>
                     <button type="button" id="addBirdButton" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
                        追加
                    </button>
                </div>
            </div>
        </div>
     `;
     
     // --- 3. 観察リストアコーディオン ---
     const birdSortOptions = [
        { value: 'added_asc', label: '追加順' },
        { value: 'name_asc', label: '名前順' },
        // ★★★ 修正点: レア度ソートを追加 ★★★
        { value: 'rarity_desc', label: 'レア度 (高い順)' },
        { value: 'rarity_asc', label: 'レア度 (低い順)' },
        { value: 'type_seen', label: '目視' },
        { value: 'type_heard', label: '声' },
        { value: 'type_photo', label: '写真' },
        { value: 'type_video', label: '動画' },
     ];
     const birdSortKey = appState.eventControls.detailSort;
     
     const birdTableHtml = `
        <div id="bird-list-accordion-container" class="bg-white rounded-lg shadow overflow-hidden">
            <button id="bird-list-accordion-toggle" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold">観察リスト</h3>
                <svg id="bird-list-accordion-arrow" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id="bird-list-accordion-content" class="accordion-content" style="max-height: 0px;">
                <div class="p-4 border-t border-gray-200">
                    <label for="bird-list-sort" class="block text-sm font-medium text-gray-500 mb-1">並び替え</label>
                    <select id="bird-list-sort" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                        ${birdSortOptions.map(opt => 
                            `<option value="${opt.value}" ${opt.value === birdSortKey ? 'selected' : ''}>${opt.label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">数</th>
                                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">確認</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody id="observed-birds-table" class="bg-white divide-y divide-gray-200">
                            ${renderObservedBirdsTable()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

     // --- 4. イベントメモアコーディオン ---
     const memoHtml = `
        <div class="bg-white rounded-lg shadow">
            <button id="memo-accordion-toggle" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold text-gray-800">イベントメモ</h3>
                <svg id="memo-accordion-arrow" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div id="memo-accordion-content" class="accordion-content" style="max-height: 0px;">
                <div class="p-4 border-t border-gray-200">
                    <label for="event-memo" class="sr-only">イベントメモ</label>
                    <textarea id="event-memo" rows="5" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="イベントの感想や特記事項、気づいた点などを記入...">${escapeHTML(event.memo)}</textarea>
                    <p class="text-xs text-gray-500 mt-1">入力内容は自動で保存されます。</p>
                </div>
            </div>
        </div>
     `;
     
     // --- 全体描画 ---
     // ★★★ 修正点: 外側のdivに p-2 を追加 ★★★
     app.innerHTML = `
        <div class="space-y-4 p-2">
            <h2 class="text-2xl font-bold text-gray-900">${escapeHTML(event.name || '無題のイベント')}</h2>
            ${eventDetailsHtml}
            ${addBirdFormHtml}
            ${birdTableHtml}
            ${memoHtml}
        </div>`;
     updateHeader('eventDetail', event.name || 'イベント詳細');
     
     setTimeout(setupEventDetailListeners, 0);
}

// ★ 修正: 汎用アコーディオン開閉関数
function toggleAccordion(contentId, arrowId, forceOpen = false) {
    const content = document.getElementById(contentId);
    const arrow = document.getElementById(arrowId);
    if (!content || !arrow) {
        console.error("Accordion elements not found:", contentId, arrowId);
        return;
    }
    
    // 現在の高さを取得
    const currentMaxHeight = content.style.maxHeight;

    if (forceOpen) {
        // すでに開いている場合でも、高さを再計算して設定
        // scrollHeight が 0 の場合があるため、最小高さを設定 (例: 500px)
        content.style.maxHeight = (content.scrollHeight > 0 ? content.scrollHeight : 500) + 'px'; 
        arrow.classList.add('arrow-up');
    } else {
        if (currentMaxHeight !== '0px' && currentMaxHeight !== '') {
            content.style.maxHeight = '0px';
            arrow.classList.remove('arrow-up');
        } else {
            content.style.maxHeight = (content.scrollHeight > 0 ? content.scrollHeight : 500) + 'px'; 
            arrow.classList.add('arrow-up');
        }
    }
}

// 編集モード切り替え
function setEventEditMode(isEditing) {
    const viewMode = document.getElementById('event-details-view');
    const editMode = document.getElementById('event-details-edit-form');

    if (!viewMode || !editMode) return;

    if (isEditing) {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        toggleAccordion('event-accordion-content', 'event-accordion-arrow', true); 
    } else {
        viewMode.classList.remove('hidden');
        editMode.classList.add('hidden');
    }
}

// --- イベント詳細画面のリスナー設定 ---
function setupEventDetailListeners() {
    try {
        // 鳥追加フォーム
        const birdNameInput = document.getElementById('bird_name_input');
        const addBirdButton = document.getElementById('addBirdButton');
        
        if (birdNameInput) {
            birdNameInput.addEventListener('input', (e) => {
                const text = e.target.value;
                const suggestions = getSearchSuggestions(text); 
                renderEventBirdSuggestions(suggestions);
            });
        }
        if (addBirdButton) {
            addBirdButton.onclick = handleAddBirdToEvent;
        }

        // --- アコーディオンのリスナー設定 ---
        const accordionToggle = document.getElementById('event-accordion-toggle');
        if (accordionToggle) {
            accordionToggle.onclick = () => toggleAccordion('event-accordion-content', 'event-accordion-arrow');
        }
        
        const addBirdToggle = document.getElementById('add-bird-accordion-toggle');
        if (addBirdToggle) {
            addBirdToggle.onclick = () => toggleAccordion('add-bird-accordion-content', 'add-bird-accordion-arrow');
        }
        
        const birdListToggle = document.getElementById('bird-list-accordion-toggle');
        if (birdListToggle) {
            birdListToggle.onclick = () => toggleAccordion('bird-list-accordion-content', 'bird-list-accordion-arrow');
        }

        const memoToggle = document.getElementById('memo-accordion-toggle');
        if (memoToggle) {
            memoToggle.onclick = () => toggleAccordion('memo-accordion-content', 'memo-accordion-arrow');
        }

        // メモの自動保存リスナー
        const memoTextarea = document.getElementById('event-memo');
        if (memoTextarea) {
            memoTextarea.addEventListener('input', (e) => {
                const event = birdEvents[currentEventIndex];
                if (event) {
                    event.memo = e.target.value;
                    saveEventsData(); // 入力するたびに保存
                }
            });
        }

        // --- イベント編集関連のリスナー ---
        const editButton = document.getElementById('edit-event-btn');
        if (editButton) {
            editButton.onclick = () => setEventEditMode(true);
        }
        
        const cancelButton = document.getElementById('cancel-edit-event-btn');
        if (cancelButton) {
            cancelButton.onclick = () => setEventEditMode(false);
        }

        const editForm = document.getElementById('event-details-edit-form');
        if (editForm) {
            editForm.onsubmit = handleSaveEventDetails;
        }

        // --- テーブル関連のリスナー ---
        const birdTable = document.getElementById('observed-birds-table');
        if (birdTable) {
            birdTable.onclick = (e) => {
                if (e.target.classList.contains('remove-bird-btn')) {
                    const birdIndex = parseInt(e.target.dataset.index, 10);
                    handleRemoveBirdFromEvent(birdIndex);
                }
            };
        }
        
        const birdSortSelect = document.getElementById('bird-list-sort');
        if (birdSortSelect) {
            birdSortSelect.addEventListener('change', (e) => {
                appState.eventControls.detailSort = e.target.value;
                saveListControlsState(); 
                const tableBody = document.getElementById('observed-birds-table');
                if (tableBody) {
                    tableBody.innerHTML = renderObservedBirdsTable();
                }
            });
        }

    } catch (error) {
        console.error("Error setting up event detail listeners:", error);
    }
}

// --- イベントに鳥を追加する処理 ---
async function handleAddBirdToEvent() {
    try {
        const nameInput = document.getElementById('bird_name_input');
        const countInput = document.getElementById('bird_count_input');
        const seenInput = document.getElementById('bird_seen_input');
        const heardInput = document.getElementById('bird_heard_input');
        const photoInput = document.getElementById('bird_photo_input');
        const videoInput = document.getElementById('bird_video_input');
        
        const event = birdEvents[currentEventIndex];
        if (!nameInput || !countInput || !seenInput || !heardInput || !photoInput || !videoInput || !event) {
            console.error("Event add bird form elements not found or no event selected.");
            return;
        }
        
        const name = nameInput.value.trim();
        const count = parseInt(countInput.value, 10) || 1;
        const seen = seenInput.checked;
        const heard = heardInput.checked;
        const photo = photoInput.checked;
        const video = videoInput.checked;
        
        if (!name) {
            console.warn("鳥の名前が入力されていません。"); 
            return;
        }
        
        event.observedBirds.push({ name, count, seen, heard, photo, video });
        
        // ★ 機能追加: birdDatabase を更新
        const birdInDB = birdDatabase.find(b => b.name === name);
        let birdDataNeedsSave = false;
        if (birdInDB) {
            // 1. イベント連携（日付・場所）
            birdInDB.observed_date = event.dateTime;
            birdInDB.observed_location = event.location;
            birdInDB.lastObservedEventId = event.id;
            birdDataNeedsSave = true;
            
            // 2. ★ ライフリスト自動更新 (設定がONの場合のみ)
            if (appState.settings.autoUpdateLiferList) {
                // ユーザーの設計:「手動を優先し、その後にイベントで該当種を観察した場合、上書きされる」
                // → 自動更新がONなら、イベントは常に手動設定（false）を上書き（trueに）する
                if (seen) birdInDB.lifer_seen = true;
                if (heard) birdInDB.lifer_heard = true;
                if (photo) birdInDB.lifer_photo = true;
                if (video) birdInDB.lifer_video = true;
            }
            
            console.log(`図鑑データを連携: ${name}`);
        }
        
        // イベントデータと、(必要なら)図鑑データの両方をDBに保存
        await saveEventsData(); 
        if (birdDataNeedsSave) {
            await saveDatabase(); // app.js の関数
        }

        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
        } else {
            console.error("Observed birds table body not found.");
        }
        
        // フォームをリセット
        nameInput.value = '';
        countInput.value = '1';
        seenInput.checked = false;
        heardInput.checked = false;
        photoInput.checked = false; 
        videoInput.checked = false; 
        
        const suggestionsBox = document.getElementById('bird_name_suggestions');
        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
        }
        
        toggleAccordion('add-bird-accordion-content', 'add-bird-accordion-arrow', true);
        
    } catch(error) {
        console.error("Error adding bird to event:", error);
    }
}

// --- イベントから鳥を削除する処理 ---
// ★ 修正: async に変更し、カスタムモーダルを使用
async function handleRemoveBirdFromEvent(birdIndex) {
    const event = birdEvents[currentEventIndex];
    if (!event || !event.observedBirds[birdIndex]) {
        console.error("Bird not found for removal.");
        return;
    }

    const birdName = event.observedBirds[birdIndex].name;
    
    // ★ 修正: カスタム確認モーダル(showCustomConfirm)を使用
    const confirmed = await showCustomConfirm(
        `「${escapeHTML(birdName)}」をリストから削除しますか？`,
        '削除'
    );
    
    if (confirmed) {
        console.log(`「${escapeHTML(birdName)}」をリストから削除します。`);
        
        event.observedBirds.splice(birdIndex, 1); 
        await saveEventsData(); // ★ await

        // ★★★ 修正: データ不整合を解消するため、お掃除関数を呼び出す ★★★
        // (app.js で定義されたグローバル関数)
        await rescanLatestEventForBirds([birdName]);

        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
        }
    }
}

// --- イベント詳細を保存する処理 ---
async function handleSaveEventDetails(e) {
    e.preventDefault();
    const event = birdEvents[currentEventIndex];
    if (!event) return;

    const form = document.getElementById('event-details-edit-form');
    if (!form) return;

    const formData = new FormData(form);
    
    event.name = formData.get('name') || '無題のイベント';
    event.dateTime = formData.get('dateTime');
    event.weather = formData.get('weather');
    event.location = formData.get('location');
    event.companions = formData.get('companions');
    
    // ★ 機能追加: このイベントに登録されている鳥の情報を、図鑑側でも更新
    let birdDataNeedsSave = false;
    // ★★★ 修正: お掃除関数を呼ぶために、影響を受ける鳥のリストを収集 ★★★
    const birdNamesToRescan = []; 
    
    for (const observedBird of event.observedBirds) {
        birdNamesToRescan.push(observedBird.name); // このイベントの鳥は全員再スキャン
        
        const birdInDB = birdDatabase.find(b => b.name === observedBird.name);
        if (birdInDB && birdInDB.lastObservedEventId === event.id) {
            // このイベントが最新の観察記録である鳥だけ、情報を更新
            birdInDB.observed_date = event.dateTime;
            birdInDB.observed_location = event.location;
            birdDataNeedsSave = true;
        }
    }
    
    // 両方のDBを保存
    await saveEventsData(); 
    if (birdDataNeedsSave) {
        await saveDatabase();
        console.log("イベント情報変更に伴い、図鑑データを更新しました。");
    }
    
    // ★★★ 修正: 変更したイベントの日付/場所が最新の場合に備え、再スキャン ★★★
    // (saveDatabaseの *後* で呼び出す)
    await rescanLatestEventForBirds(birdNamesToRescan);

    setEventEditMode(false);

    updateHeader('eventDetail', event.name);
    
    const viewMode = document.getElementById('event-details-view');
    if (viewMode) {
        const details = [
             { label: '日時', value: event.dateTime || '(未設定)' },
             { label: '天気', value: event.weather || '(未設定)' },
             { label: '場所', value: event.location || '(未設定)' },
             { label: '同行者', value: event.companions || '(なし)' },
        ];
        viewMode.innerHTML = `
            ${details.map(d => `
                <div>
                    <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                    <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value) || '(未設定)'}</dd>
                </div>
            `).join('')}
            <div class="pt-2">
                <button id="edit-event-btn" class="text-sm font-medium text-emerald-600 hover:text-emerald-800">編集</button>
            </div>
        `;
        const newEditButton = document.getElementById('edit-event-btn');
        if (newEditButton) {
            newEditButton.onclick = () => setEventEditMode(true);
        }
    }
    
    const titleElement = document.querySelector('#app h2');
    if (titleElement) {
        titleElement.textContent = escapeHTML(event.name);
    }
}

// ★ 機能追加: イベント自体を削除する処理
async function handleDeleteEvent(eventIndex) {
    if (eventIndex < 0 || eventIndex >= birdEvents.length) {
        console.error("Invalid event index for deletion.");
        return;
    }
    
    const event = birdEvents[eventIndex];
    const eventName = event.name || '無題のイベント';

    // ★ 修正: カスタム確認モーダル(showCustomConfirm)を使用
    const confirmed = await showCustomConfirm(
        `イベント「${escapeHTML(eventName)}」を本当に削除しますか？\nこのイベントの全ての観察記録（鳥、メモ）が失われます。`,
        'イベントを削除'
    );
    
    if (confirmed) {
        console.log(`イベント「${escapeHTML(eventName)}」を削除します。`);
        
        // ★★★ 修正: 削除する前に、影響を受ける鳥のリストを取得 ★★★
        const birdNamesToRescan = event.observedBirds.map(b => b.name);
        
        birdEvents.splice(eventIndex, 1); // 配列から削除
        await saveEventsData(); // DBに保存

        // ★★★ 修正: データ不整合を解消するため、お掃除関数を呼び出す ★★★
        await rescanLatestEventForBirds(birdNamesToRescan);

        // ページ番号がリストの範囲外になったかチェック
        const totalItems = birdEvents.length;
        const totalPages = Math.ceil(totalItems / EVENT_ITEMS_PER_PAGE);
        if (appState.eventControls.currentPage > totalPages && totalPages > 0) {
            appState.eventControls.currentPage = totalPages;
            saveListControlsState();
        }

        // イベントリストを再描画
        showEventsPage();
    }
}

// ★ 機能追加: イベントリストのページネーション描画
function renderEventPaginationControls(totalItems, totalPages) { 
    const controlsElement = document.getElementById('event-pagination-controls');
    if (!controlsElement) {
        console.error("Event pagination controls element not found.");
        return;
    }
    
    const currentPg = appState.eventControls.currentPage; 

    if (totalPages <= 1) {
        controlsElement.innerHTML = '';
        return;
    }

    const pageInfo = `
        <span class="text-sm text-gray-600">
            ${totalItems} 件中 ${Math.min( (currentPg - 1) * EVENT_ITEMS_PER_PAGE + 1, totalItems )}
            - ${Math.min( currentPg * EVENT_ITEMS_PER_PAGE, totalItems )} 件
        </span>`;
    
    const prevButton = `
        <button id="event-prev-page" class="pagination-button px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                ${currentPg === 1 ? 'disabled' : ''}>
            前へ
        </button>`;
    
    const nextButton = `
        <button id="event-next-page" class="pagination-button px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                ${currentPg === totalPages ? 'disabled' : ''}>
            次へ
        </button>`;

    controlsElement.innerHTML = `${prevButton} ${pageInfo} ${nextButton}`;
    
    // ★ 修正: リスナーをここで設定（DOM描画後）
    setTimeout(() => {
        const prevBtn = document.getElementById('event-prev-page');
        const nextBtn = document.getElementById('event-next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (appState.eventControls.currentPage > 1) {
                    appState.eventControls.currentPage--;
                    showEventsPage(); // ページ全体を再描画
                    window.scrollTo(0, 0); 
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (appState.eventControls.currentPage < totalPages) {
                    appState.eventControls.currentPage++;
                    showEventsPage(); // ページ全体を再描画
                    window.scrollTo(0, 0); 
                }
            });
        }
    }, 0);
}