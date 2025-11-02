// --- イベントリスト画面 ---
function showEventsPage() { 
    appState.currentPage = 'events'; appState.isEditing = false;
    
    // 日本語ソート用のコレーター
    const jaCollator = new Intl.Collator('ja');
    
    // ★ 機能追加: 並び替えオプション
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

    const formatDate = (dateStr) => { 
        if (!dateStr) return '日時未設定';
        try {
            const date = new Date(dateStr.replace(' ', 'T') + ':00'); 
            if (isNaN(date)) return dateStr; 
            return date.toLocaleDateString('ja-JP'); 
        } catch { return dateStr; }
    }; 
    
    // ★ 機能追加: 並び替えロジック
    let sortedEvents = [...birdEvents];
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

    let listHtml = sortedEvents.length === 0 ? '<p class="text-gray-500 text-center py-4">記録されたイベントはありません。</p>' : 
        sortedEvents.map((ev) => {
            const originalIndex = birdEvents.findIndex(e => e.id === ev.id); 
            if (originalIndex === -1) return ''; 
            return `<div class="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex justify-between items-center" onclick="showEventDetail(${originalIndex})">
                        <div>
                            <h3 class="font-semibold text-gray-800">${escapeHTML(ev.name || '無題のイベント')}</h3>
                            <p class="text-sm text-gray-500">${escapeHTML(formatDate(ev.dateTime))}</p>
                        </div>
                        <span class="text-xs text-gray-400">&gt;</span>
                    </div>`;
        }).join('');
        
     app.innerHTML = `
        <div class="space-y-4">
             <button id="newEventButton" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">新規イベント作成</button>
             ${sortSelectHtml}
             <div class="bg-white rounded-lg shadow overflow-hidden">
                <h2 class="text-xl font-semibold p-4 border-b border-gray-200">イベント履歴</h2>
                <div id="event-list">${listHtml}</div>
             </div>
        </div>`;
    updateHeader('events', 'イベント');

    // ★ 修正: DOMの描画が完了するのを待つ
    setTimeout(() => {
        const newEventBtn = document.getElementById('newEventButton');
        if (newEventBtn) {
            newEventBtn.onclick = showNewEventForm; 
        } else {
            console.error("New event button not found");
        }
        
        // ★ 機能追加: 並び替えセレクトのリスナー
        const sortSelect = document.getElementById('event-list-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                appState.eventControls.listSort = e.target.value;
                saveListControlsState(); // 状態を保存
                showEventsPage(); // 画面を再描画
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
        observedBirds: [] 
    };
    
    app.innerHTML = `
    <form id="newEventForm" class="bg-white rounded-lg shadow p-4 space-y-4">
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
        <button type="submit" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">
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
    
    // ★ 機能追加: 観察リストの並び替え
    const jaCollator = new Intl.Collator('ja');
    const sortKey = appState.eventControls.detailSort;
    let sortedBirds = [...event.observedBirds]; // 元の配列（追加順）をコピー
    
    // 観察タイプに基づくスコアを計算
    const getObservationScore = (b) => {
        let score = 0;
        if (b.seen) score += 8;
        if (b.heard) score += 4;
        if (b.photo) score += 2;
        if (b.video) score += 1;
        return score;
    };

    switch(sortKey) {
        case 'name_asc':
            sortedBirds.sort((a, b) => jaCollator.compare(a.name || '', b.name || ''));
            break;
        case 'type':
            // スコアが高い順 (目視 > 声 > 写真 > 動画)
            sortedBirds.sort((a, b) => getObservationScore(b) - getObservationScore(a));
            break;
        case 'added_asc':
        default:
            // 何もせず、コピーしたまま（追加順）
            break;
    }
    
     if (sortedBirds.length === 0) {
         return '<tr><td colspan="5" class="text-center text-gray-500 py-4">まだ鳥が追加されていません。</td></tr>';
     }
     
     // ★ 修正: アイコンと colspan
     // ★ 修正: SVGアイコンを使用 (w-5 h-5 text-gray-600)
     const iconSeen = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
     const iconHeard = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 6V4m0 16v-2m-3.072-1.928a5 5 0 017.072 0M5.024 14.928a5 5 0 010-7.072"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10a2 2 0 110 4 2 2 0 010-4z"></path></svg>`;
     const iconPhoto = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
     const iconVideo = `<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 5h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>`;

     return sortedBirds.map((b) => {
         // ★ 修正: 元の配列でのインデックスを探す (削除機能のため)
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
     
     const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
     const defaultDateTime = now.toISOString().slice(0, 16);

     const details = [
         { label: '日時', name: 'dateTime', value: event.dateTime || '', type: 'datetime-local', placeholder: defaultDateTime },
         { label: '天気', name: 'weather', value: event.weather || '', type: 'text', placeholder: '例: 晴れ' },
         { label: '場所', name: 'location', value: event.location || '', type: 'text', placeholder: '例: 〇〇公園' },
         { label: '同行者', name: 'companions', value: event.companions || '', type: 'text', placeholder: '例: Aさん' },
     ];
     
     // ★ 修正: 文言変更 "基本情報"
     const eventDetailsHtml = `
        <div class="bg-white rounded-lg shadow mb-4">
            <button id="event-accordion-toggle" class="w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold text-gray-800">基本情報</h3>
                <svg id="event-accordion-arrow" class="h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
     
     // ★ 修正: 文言、チェックボックス追加、アイコン
     const iconSeen = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
     const iconHeard = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M12 6V4m0 16v-2m-3.072-1.928a5 5 0 017.072 0M5.024 14.928a5 5 0 010-7.072"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10a2 2 0 110 4 2 2 0 010-4z"></path></svg>`;
     const iconPhoto = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`;
     const iconVideo = `<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 5h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>`;
     
     const addBirdFormHtml = `
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mt-4">
            <h4 class="font-semibold text-gray-800">観察した鳥を追加</h4>
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
             <button type="button" id="addBirdButton" class="w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors">
                追加
            </button>
        </div>
     `;
     
     // ★ 機能追加: 観察リストの並び替え
     const birdSortOptions = [
        { value: 'added_asc', label: '追加した順' },
        { value: 'name_asc', label: '名前 (昇順)' },
        { value: 'type', label: '確認方法 (目視/声...)' }
     ];
     const birdSortKey = appState.eventControls.detailSort;
     const birdSortSelectHtml = `
        <div class="px-4 pt-4 pb-2">
            <label for="bird-list-sort" class="block text-sm font-medium text-gray-500 mb-1">並び替え</label>
            <select id="bird-list-sort" class="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                ${birdSortOptions.map(opt => 
                    `<option value="${opt.value}" ${opt.value === birdSortKey ? 'selected' : ''}>${opt.label}</option>`
                ).join('')}
            </select>
        </div>
     `;
     
     const birdTableHtml = `
        <div id="observed-birds-table-container" class="bg-white rounded-lg shadow overflow-hidden mt-4">
            <h3 class="text-lg font-semibold p-4 border-b border-gray-200">観察リスト</h3>
            ${birdSortSelectHtml}
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
        </div>`;
     
     app.innerHTML = `
        <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900">${escapeHTML(event.name || '無題のイベント')}</h2>
            ${eventDetailsHtml}
            ${addBirdFormHtml}
            ${birdTableHtml}
        </div>`;
     updateHeader('eventDetail', event.name || 'イベント詳細');
     
     setTimeout(setupEventDetailListeners, 0);
}

// アコーディオン開閉
function toggleEventAccordion(forceOpen = false) {
    const content = document.getElementById('event-accordion-content');
    const arrow = document.getElementById('event-accordion-arrow');
    if (!content || !arrow) return;

    if (forceOpen) {
        content.style.maxHeight = '500px'; 
        arrow.classList.add('arrow-up');
    } else {
        if (content.style.maxHeight !== '0px') {
            content.style.maxHeight = '0px';
            arrow.classList.remove('arrow-up');
        } else {
            content.style.maxHeight = '500px'; 
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
        toggleEventAccordion(true); 
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

        // アコーディオンのリスナー
        const accordionToggle = document.getElementById('event-accordion-toggle');
        if (accordionToggle) {
            accordionToggle.onclick = (e) => {
                if (e.target.closest('#event-accordion-arrow') || e.target.id === 'event-accordion-toggle' || e.target.closest('h3')) {
                    toggleEventAccordion();
                }
            };
        }

        // イベント編集関連のリスナー
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

        // 鳥削除ボタンのリスナー (イベント委任)
        const birdTable = document.getElementById('observed-birds-table');
        if (birdTable) {
            birdTable.onclick = (e) => {
                if (e.target.classList.contains('remove-bird-btn')) {
                    const birdIndex = parseInt(e.target.dataset.index, 10);
                    handleRemoveBirdFromEvent(birdIndex);
                }
            };
        }
        
        // ★ 機能追加: 観察リストの並び替えリスナー
        const birdSortSelect = document.getElementById('bird-list-sort');
        if (birdSortSelect) {
            birdSortSelect.addEventListener('change', (e) => {
                appState.eventControls.detailSort = e.target.value;
                saveListControlsState(); // 状態を保存
                // テーブルのボディだけを再描画
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
function handleAddBirdToEvent() {
    try {
        const nameInput = document.getElementById('bird_name_input');
        const countInput = document.getElementById('bird_count_input');
        // ★ 修正: 新しいチェックボックスを取得
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
        // ★ 修正: 新しい値を取得
        const seen = seenInput.checked;
        const heard = heardInput.checked;
        const photo = photoInput.checked;
        const video = videoInput.checked;
        
        if (!name) {
            console.warn("鳥の名前が入力されていません。"); 
            return;
        }
        
        // ★ 修正: 新しい値を追加
        event.observedBirds.push({ name, count, seen, heard, photo, video });
        
        saveEventsData(); 

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
        photoInput.checked = false; // ★ 修正
        videoInput.checked = false; // ★ 修正
        
        const suggestionsBox = document.getElementById('bird_name_suggestions');
        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
        }
        
    } catch(error) {
        console.error("Error adding bird to event:", error);
    }
}

// --- イベントから鳥を削除する処理 ---
function handleRemoveBirdFromEvent(birdIndex) {
    const event = birdEvents[currentEventIndex];
    if (!event || !event.observedBirds[birdIndex]) {
        console.error("Bird not found for removal.");
        return;
    }

    const birdName = event.observedBirds[birdIndex].name;
    if (confirm(`「${escapeHTML(birdName)}」をリストから削除しますか？`)) {
        event.observedBirds.splice(birdIndex, 1); 
        saveEventsData(); 

        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
        }
    }
}

// --- イベント詳細を保存する処理 ---
function handleSaveEventDetails(e) {
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
    
    saveEventsData(); 

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

