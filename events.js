// --- イベントリスト画面 ---
function showEventsPage() { 
     appState.currentPage = 'events'; appState.isEditing = false;
      const formatDate = (dateStr) => { 
          if (!dateStr) return '日時未設定';
            try {
                const date = new Date(dateStr.replace(' ', 'T') + ':00'); 
                if (isNaN(date)) return dateStr; 
                return date.toLocaleDateString('ja-JP'); 
            } catch { return dateStr; }
      }; 
     let listHtml = (!birdEvents || birdEvents.length === 0) ? '<p class="text-gray-500 text-center py-4">記録されたイベントはありません。</p>' : 
        [...birdEvents].sort((a,b)=>(b.dateTime||'').localeCompare(a.dateTime||'')) 
        .map((ev) => {
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
             <div class="bg-white rounded-lg shadow overflow-hidden"><h2 class="text-xl font-semibold p-4 border-b border-gray-200">イベント履歴</h2><div id="event-list">${listHtml}</div></div>
        </div>`;
    updateHeader('events', 'イベント');

    // ★ 修正: DOMの描画が完了するのを待つため、setTimeoutで呼び出す
    setTimeout(() => {
        const newEventBtn = document.getElementById('newEventButton');
        if (newEventBtn) {
            newEventBtn.onclick = showNewEventForm; 
        } else {
            console.error("New event button not found");
        }
    }, 0);
}

// --- 新規イベント作成画面 ---
function showNewEventForm() { 
    appState.currentPage = 'newEvent'; 
    // ★ 修正: new Date()が日本のタイムゾーンになるように調整
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
    
    // ★ 修正: DOMの描画が完了するのを待つため、setTimeoutで呼び出す
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
    
    // フォーム入力で eventData オブジェクトをリアルタイムに更新
    form.querySelectorAll('.event-input').forEach(input => {
        input.addEventListener('input', (e) => { 
            if (eventData) {
                eventData[e.target.name] = e.target.value; 
            }
        });
    });
    
    // フォーム送信時の処理
    form.onsubmit = (e) => {
        // デフォルトのフォーム送信をキャンセル
        e.preventDefault(); 
        
        // ★ 修正: フォームから最新の値を取得し直す (datetime-local のため)
        const formData = new FormData(form);
        const finalEventData = {
            ...eventData, // id や observedBirds を引き継ぐ
            name: formData.get('name') || '無題のイベント',
            dateTime: formData.get('dateTime'),
            weather: formData.get('weather'),
            location: formData.get('location'),
            companions: formData.get('companions'),
        };

        // handleSaveNewEvent を呼び出す
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
    
    // ★ 修正: DOMの描画が完了するのを待つ
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
     if (!event || !event.observedBirds || event.observedBirds.length === 0) {
         return '<tr><td colspan="4" class="text-center text-gray-500 py-4">まだ鳥が追加されていません。</td></tr>';
     }
     
     return event.observedBirds.map((b, idx) => `
        <tr class="text-sm border-b border-gray-100 last:border-b-0">
            <td class="px-4 py-3 font-medium text-gray-900">${escapeHTML(b.name)}</td>
            <td class="px-2 py-3 text-gray-500 text-center">${b.count}</td>
            <td class="px-2 py-3 text-gray-500 text-center">
                ${b.seen ? '<span title="目視">👁️</span>' : ''} ${b.heard ? '<span title="声">🔊</span>' : ''}
            </td>
            <td class="px-4 py-3 text-right">
                <!-- ★ 機能追加: 削除ボタン -->
                <button type="button" class="remove-bird-btn text-red-500 hover:text-red-700 text-xs font-medium" data-index="${idx}">
                    削除
                </button>
            </td>
        </tr>`).join('');
} 

// --- 新規イベント保存 ---
// ★ 修正: 引数を eventData オブジェクトに変更
function handleSaveNewEvent(eventData) { 
    if (!eventData) return;
    birdEvents.push({ ...eventData, observedBirds: [] }); // observedBirds は空で作成
    saveEventsData(); 
    currentEventIndex = -1; 
    showEventsPage(); 
}

// --- イベント詳細表示 ---
function showEventDetail(originalIndex) { 
     const event = birdEvents[originalIndex]; if (!event) return;
     appState.currentPage = 'eventDetail'; 
     currentEventIndex = originalIndex; 
     
     // ★ 修正: new Date()が日本のタイムゾーンになるように調整
     const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
     const defaultDateTime = now.toISOString().slice(0, 16);

     const details = [
         { label: '日時', name: 'dateTime', value: event.dateTime || '', type: 'datetime-local', placeholder: defaultDateTime },
         { label: '天気', name: 'weather', value: event.weather || '', type: 'text', placeholder: '例: 晴れ' },
         { label: '場所', name: 'location', value: event.location || '', type: 'text', placeholder: '例: 〇〇公園' },
         { label: '同行者', name: 'companions', value: event.companions || '', type: 'text', placeholder: '例: Aさん' },
     ];
     
     // ★ 機能追加: アコーディオンと編集フォーム
     const eventDetailsHtml = `
        <div class="bg-white rounded-lg shadow mb-4">
            <!-- アコーディオンヘッダー -->
            <button id="event-accordion-toggle" class="w-full flex justify-between items-center p-4 text-left">
                <h3 class="text-lg font-semibold text-gray-800">イベント基本情報</h3>
                <div class="flex items-center space-x-2">
                    <button id="edit-event-btn" class="text-sm font-medium text-emerald-600 hover:text-emerald-800">編集</button>
                    <!-- アコーディオン矢印 -->
                    <svg id="event-accordion-arrow" class="h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            
            <!-- アコーディオンコンテンツ -->
            <div id="event-accordion-content" class="accordion-content" style="max-height: 0px;">
                <!-- 閲覧モード -->
                <dl id="event-details-view" class="p-4 border-t border-gray-200 space-y-3">
                    ${details.map(d => `
                        <div>
                            <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                            <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value) || '(未設定)'}</dd>
                        </div>
                    `).join('')}
                </dl>
                
                <!-- 編集モード (最初は隠す) -->
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
     
     const addBirdFormHtml = `
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mt-4">
            <h4 class="font-semibold text-gray-800">鳥の追加</h4>
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
                <div class="flex items-center space-x-3 pt-5">
                    <label class="flex items-center space-x-1"><input type="checkbox" id="bird_seen_input" class="form-checkbox text-emerald-600 rounded"><span>目視</span></label>
                    <label class="flex items-center space-x-1"><input type="checkbox" id="bird_heard_input" class="form-checkbox text-emerald-600 rounded"><span>声</span></label>
                </div>
            </div>
             <button type="button" id="addBirdButton" class="w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors">
                リストに追加
            </button>
        </div>
     `;
     
     const birdTableHtml = `
        <div id="observed-birds-table-container" class="bg-white rounded-lg shadow overflow-hidden mt-4">
            <h3 class="text-lg font-semibold p-4 border-b border-gray-200">観察リスト</h3>
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
     
     // ★ 修正: DOMの描画が完了するのを待つため、setTimeoutで呼び出す
     setTimeout(setupEventDetailListeners, 0);
}

// ★ 機能追加: アコーディオン開閉
function toggleEventAccordion(forceOpen = false) {
    const content = document.getElementById('event-accordion-content');
    const arrow = document.getElementById('event-accordion-arrow');
    if (!content || !arrow) return;

    if (forceOpen) {
        content.style.maxHeight = '500px'; // 十分な高さを確保
        arrow.classList.add('arrow-up');
    } else {
        if (content.style.maxHeight !== '0px') {
            content.style.maxHeight = '0px';
            arrow.classList.remove('arrow-up');
        } else {
            content.style.maxHeight = '500px'; // 十分な高さを確保
            arrow.classList.add('arrow-up');
        }
    }
}

// ★ 機能追加: 編集モード切り替え
function setEventEditMode(isEditing) {
    const viewMode = document.getElementById('event-details-view');
    const editMode = document.getElementById('event-details-edit-form');
    const editButton = document.getElementById('edit-event-btn');

    if (!viewMode || !editMode || !editButton) return;

    if (isEditing) {
        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        editButton.classList.add('hidden');
        toggleEventAccordion(true); // 編集時は強制的にアコーディオンを開く
    } else {
        viewMode.classList.remove('hidden');
        editMode.classList.add('hidden');
        editButton.classList.remove('hidden');
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
                // ★ 修正: app.js に移動した共通関数を呼ぶ
                const suggestions = getSearchSuggestions(text); 
                renderEventBirdSuggestions(suggestions);
            });
        }
        if (addBirdButton) {
            addBirdButton.onclick = handleAddBirdToEvent;
        }

        // ★ 機能追加: アコーディオンのリスナー
        const accordionToggle = document.getElementById('event-accordion-toggle');
        if (accordionToggle) {
            accordionToggle.onclick = (e) => {
                // 編集ボタンが押された場合はトグルさせない
                if (e.target.id !== 'edit-event-btn') {
                    toggleEventAccordion();
                }
            };
        }

        // ★ 機能追加: イベント編集関連のリスナー
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

        // ★ 機能追加: 鳥削除ボタンのリスナー (イベント委任)
        const birdTable = document.getElementById('observed-birds-table');
        if (birdTable) {
            birdTable.onclick = (e) => {
                if (e.target.classList.contains('remove-bird-btn')) {
                    const birdIndex = parseInt(e.target.dataset.index, 10);
                    handleRemoveBirdFromEvent(birdIndex);
                }
            };
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
        const seenInput = document.getElementById('bird_seen_input');
        const heardInput = document.getElementById('bird_heard_input');
        
        const event = birdEvents[currentEventIndex];
        if (!nameInput || !countInput || !seenInput || !heardInput || !event) {
            console.error("Event add bird form elements not found or no event selected.");
            return;
        }
        
        const name = nameInput.value.trim();
        const count = parseInt(countInput.value, 10) || 1;
        const seen = seenInput.checked;
        const heard = heardInput.checked;
        
        if (!name) {
            console.warn("鳥の名前が入力されていません。"); // alertの代わり
            return;
        }
        
        event.observedBirds.push({ name, count, seen, heard });
        
        // ★ 修正: 保存は saveEventsData() を呼ぶ (ヘッダーの「戻る」でも保存されるが、即時保存が望ましい)
        saveEventsData(); 

        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
            // ★ 修正: テーブルが再描画された後、削除ボタンのリスナーを再セットアップ
            // (イベント委任を使っているので、厳密には不要だが、念のため)
            // setupEventDetailListeners() を呼ぶと無限ループになるため、
            // birdTable.onclick は setupEventDetailListeners で一度設定するだけで良い
        } else {
            console.error("Observed birds table body not found.");
        }
        
        // フォームをリセット
        nameInput.value = '';
        countInput.value = '1';
        seenInput.checked = false;
        heardInput.checked = false;
        
        // 予測候補を閉じる
        const suggestionsBox = document.getElementById('bird_name_suggestions');
        if (suggestionsBox) {
            suggestionsBox.classList.add('hidden');
        }
        
    } catch(error) {
        console.error("Error adding bird to event:", error);
    }
}

// ★ 機能追加: イベントから鳥を削除する処理
function handleRemoveBirdFromEvent(birdIndex) {
    const event = birdEvents[currentEventIndex];
    if (!event || !event.observedBirds[birdIndex]) {
        console.error("Bird not found for removal.");
        return;
    }

    const birdName = event.observedBirds[birdIndex].name;
    // (★変更) confirmの代わりに、カスタムモーダル推奨だが、一旦 confirm を使用
    if (confirm(`「${escapeHTML(birdName)}」をリストから削除しますか？`)) {
        event.observedBirds.splice(birdIndex, 1); // 配列から削除
        saveEventsData(); // 変更を保存

        // テーブルを再描画
        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
        }
    }
}

// ★ 機能追加: イベント詳細を保存する処理
function handleSaveEventDetails(e) {
    e.preventDefault();
    const event = birdEvents[currentEventIndex];
    if (!event) return;

    const form = document.getElementById('event-details-edit-form');
    if (!form) return;

    const formData = new FormData(form);
    
    // イベントオブジェクトを更新
    event.name = formData.get('name') || '無題のイベント';
    event.dateTime = formData.get('dateTime');
    event.weather = formData.get('weather');
    event.location = formData.get('location');
    event.companions = formData.get('companions');
    
    saveEventsData(); // 変更を保存

    // 閲覧モードに戻す
    setEventEditMode(false);

    // ヘッダーと閲覧ビューを更新
    updateHeader('eventDetail', event.name);
    
    // ★ 修正: 閲覧ビュー（<dl>）を再描画
    const viewMode = document.getElementById('event-details-view');
    if (viewMode) {
        const details = [
             { label: '日時', value: event.dateTime || '(未設定)' },
             { label: '天気', value: event.weather || '(未設定)' },
             { label: '場所', value: event.location || '(未設定)' },
             { label: '同行者', value: event.companions || '(なし)' },
        ];
        viewMode.innerHTML = details.map(d => `
            <div>
                <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value) || '(未設定)'}</dd>
            </div>
        `).join('');
    }
    
    // ★ 修正: h2 タイトルも更新
    const titleElement = document.querySelector('#app h2');
    if (titleElement) {
        titleElement.textContent = escapeHTML(event.name);
    }
}

