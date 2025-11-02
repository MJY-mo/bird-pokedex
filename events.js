// --- イベントリスト画面 ---
function showEventsPage() { 
// ... (既存のコード ... 変更なし) ...
    const newEventBtn = document.getElementById('newEventButton');
    if (newEventBtn) newEventBtn.onclick = showNewEventForm; 
    else console.error("New event button not found");
}

// --- 新規イベント作成画面 ---
function showNewEventForm() { 
// ... (既存のコード ... 変更なし) ...
    updateHeader('newEvent', '新規イベント');
    setupNewEventFormListeners(newEventData); 
}
function setupNewEventFormListeners(eventData) { 
// ... (既存のコード ... 変更なし) ...
    form.onsubmit = (e) => handleSaveNewEvent(e, eventData); 
}
function renderEventBirdSuggestions(suggestions) { 
// ... (既存のコード ... 変更なし) ...
    box.querySelectorAll('.event-suggestion-item').forEach(item => item.addEventListener('click', () => {
        const nameInput = document.getElementById('bird_name_input');
        if (nameInput) nameInput.value = item.dataset.name; 
        box.classList.add('hidden'); 
    }));
}

// --- イベント鳥リストテーブル描画 ---
function renderObservedBirdsTable() { 
     const event = birdEvents[currentEventIndex]; 
     if (!event || !event.observedBirds || event.observedBirds.length === 0) {
         return '<tr><td colspan="4" class="text-center text-gray-500 py-4">まだ鳥が追加されていません。</td></tr>';
     }
     return event.observedBirds.map((b, idx) => `
        <tr class="text-sm">
            <td class="px-4 py-2 font-medium text-gray-900">${escapeHTML(b.name)}</td>
            <td class="px-2 py-2 text-gray-500 text-center">${b.count}</td>
            <td class="px-2 py-2 text-gray-500 text-center">
                ${b.seen ? '<span title="目視">👁️</span>' : ''} ${b.heard ? '<span title="声">🔊</span>' : ''}
            </td>
            <td class="px-2 py-2 text-right">
                <!-- ★ 修正: 削除ボタンのコメントアウトを解除 -->
                <button type="button" class="text-red-600 hover:text-red-900 text-xs" onclick="handleRemoveBirdFromEvent(${idx})">
                    削除
                </button> 
            </td>
        </tr>`).join('');
} 

// --- (★追加) 観察した鳥を削除 ---
function handleRemoveBirdFromEvent(birdIndex) {
    if (currentEventIndex === -1 || !birdEvents[currentEventIndex]) return;
    
    const event = birdEvents[currentEventIndex];
    if (!event.observedBirds || birdIndex < 0 || birdIndex >= event.observedBirds.length) return;

    // 確認ダイアログ（シンプル版）
    const birdName = event.observedBirds[birdIndex].name;
    if (!confirm(`「${birdName}」をリストから削除しますか？`)) {
        return;
    }

    // データを削除
    event.observedBirds.splice(birdIndex, 1);
    
    // テーブルを再描画
    const tableBody = document.getElementById('observed-birds-table');
    if (tableBody) {
        tableBody.innerHTML = renderObservedBirdsTable();
    }
    
    // ★ 変更の即時保存
    saveEventsData();
}

// --- 新規イベント保存 ---
function handleSaveNewEvent(event, eventData) { 
    event.preventDefault(); if (!eventData) return;
    birdEvents.push({ ...eventData, observedBirds: [] }); 
    saveEventsData(); 
    currentEventIndex = -1; 
    showEventsPage(); 
}

// --- (★追加) イベント詳細の HTML (リスト形式またはフォーム形式) を生成 ---
function renderEventDetails(event, isEditing) {
    if (!event) return '';

    if (isEditing) {
        // --- 編集フォーム ---
        return `
            <form id="editEventForm" class="space-y-3 p-4">
                <div>
                    <label for="event_name_edit" class="block text-sm font-medium text-gray-700">イベント名</label>
                    <input type="text" id="event_name_edit" name="name" value="${escapeHTML(event.name)}" class="event-input-edit mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 週末の探鳥会">
                </div>
                <div>
                    <label for="event_datetime_edit" class="block text-sm font-medium text-gray-700">日時</label>
                    <input type="datetime-local" id="event_datetime_edit" name="dateTime" value="${event.dateTime}" class="event-input-edit mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div>
                    <label for="event_weather_edit" class="block text-sm font-medium text-gray-700">天気</label>
                    <input type="text" id="event_weather_edit" name="weather" value="${escapeHTML(event.weather)}" class="event-input-edit mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 晴れ">
                </div>
                <div>
                    <label for="event_location_edit" class="block text-sm font-medium text-gray-700">場所</label>
                    <input type="text" id="event_location_edit" name="location" value="${escapeHTML(event.location)}" class="event-input-edit mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 〇〇公園">
                </div>
                <div>
                    <label for="event_companions_edit" class="block text-sm font-medium text-gray-700">同行者</label>
                    <input type="text" id="event_companions_edit" name="companions" value="${escapeHTML(event.companions)}" class="event-input-edit mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: Aさん, Bさん">
                </div>
            </form>
        `;
    } else {
        // --- 通常の表示リスト ---
        const details = [
             { label: '日時', value: event.dateTime || '(未設定)' },
             { label: '天気', value: event.weather || '(未設定)' },
             { label: '場所', value: event.location || '(未設定)' },
             { label: '同行者', value: event.companions || '(なし)' },
         ];
        return `
            <div class="p-4">
                <dl class="space-y-2">
                    ${details.map(d => `
                        <div>
                            <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                            <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value)}</dd>
                        </div>
                    `).join('')}
                </dl>
            </div>
        `;
    }
}

// --- イベント詳細表示 ---
function showEventDetail(originalIndex) { 
     const event = birdEvents[originalIndex]; if (!event) return;
     appState.currentPage = 'eventDetail'; 
     appState.isEditing = false; // ★ 状態リセット
     currentEventIndex = originalIndex; 
     
     // ★ 修正: イベント詳細をアコーディオンコンポーネントに変更
     const eventDetailsHtml = `
        <div class="bg-white rounded-lg shadow mb-4">
            <div id="event-details-header" class="accordion-header-event w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 border-b border-gray-200 cursor-pointer">
                <span>イベント基本情報</span>
                <div class="flex items-center space-x-2">
                    <!-- 編集/保存ボタンはここに動的に入る -->
                    <div id="event-edit-controls">
                        <button id="editEventButton" class="text-xs font-medium text-emerald-600 hover:text-emerald-800">編集</button>
                    </div>
                    <svg class="h-5 w-5 arrow-down" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
            <!-- ★ 修正: アコーディオンのコンテンツ（デフォルトで閉じている） -->
            <div id="event-details-content" class="accordion-content bg-gray-50">
                ${renderEventDetails(event, false)}
            </div>
        </div>
     `;
     
     // (★変更) 鳥追加フォームのHTMLを定義
     const addBirdFormHtml = `
        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3 mt-4">
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
                            <th class="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
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
     
     // (★追加) イベント詳細画面のリスナーを設定
     setupEventDetailListeners();
}

// (★追加) アコーディオン開閉
function toggleEventAccordion(button) {
    const content = document.getElementById('event-details-content');
    const arrow = button.querySelector('svg');
    if (!content || !arrow) return;

    if (content.style.maxHeight) {
        // Close
        content.style.maxHeight = null;
        arrow.classList.remove('arrow-up');
        arrow.classList.add('arrow-down');
    } else {
        // Open
        content.style.maxHeight = content.scrollHeight + "px";
        arrow.classList.remove('arrow-down');
        arrow.classList.add('arrow-up');
    }
}

// (★追加) イベント編集モード切り替え
function handleEditEvent() {
    appState.isEditing = true;
    const event = birdEvents[currentEventIndex];
    if (!event) return;

    // フォームに切り替え
    const content = document.getElementById('event-details-content');
    content.innerHTML = renderEventDetails(event, true);
    
    // ボタンを「保存」「中止」に切り替え
    const controls = document.getElementById('event-edit-controls');
    controls.innerHTML = `
        <button id="saveEventButton" class="text-xs font-medium text-emerald-600 hover:text-emerald-800">保存</button>
        <button id="cancelEditEventButton" class="text-xs font-medium text-gray-500 hover:text-gray-700 ml-2">中止</button>
    `;
    
    // アコーディオンを開く（もし閉じていたら）
    const header = document.getElementById('event-details-header');
    if (!content.style.maxHeight) {
        toggleEventAccordion(header);
    }
    
    // リスナーを再設定
    setupEventDetailListeners();
}

// (★追加) イベント保存処理
function handleSaveEvent() {
    const event = birdEvents[currentEventIndex];
    if (!event) return;
    
    // フォームからデータを取得
    const form = document.getElementById('editEventForm');
    if (!form) return;
    
    event.name = form.querySelector('#event_name_edit').value;
    event.dateTime = form.querySelector('#event_datetime_edit').value;
    event.weather = form.querySelector('#event_weather_edit').value;
    event.location = form.querySelector('#event_location_edit').value;
    event.companions = form.querySelector('#event_companions_edit').value;

    saveEventsData();
    appState.isEditing = false;
    
    // 表示を更新
    const content = document.getElementById('event-details-content');
    content.innerHTML = renderEventDetails(event, false);

    // ボタンを「編集」に戻す
    const controls = document.getElementById('event-edit-controls');
    controls.innerHTML = `<button id="editEventButton" class="text-xs font-medium text-emerald-600 hover:text-emerald-800">編集</button>`;
    
    // ヘッダーのタイトルも更新
    document.querySelector('h2.text-2xl').textContent = escapeHTML(event.name || '無題のイベント');
    updateHeader('eventDetail', event.name || 'イベント詳細');

    // リスナーを再設定
    setupEventDetailListeners();
}

// (★追加) イベント編集中止
function handleCancelEditEvent() {
    appState.isEditing = false;
    const event = birdEvents[currentEventIndex];
    if (!event) return;

    // 表示を元に戻す
    const content = document.getElementById('event-details-content');
    content.innerHTML = renderEventDetails(event, false);

    // ボタンを「編集」に戻す
    const controls = document.getElementById('event-edit-controls');
    controls.innerHTML = `<button id="editEventButton" class="text-xs font-medium text-emerald-600 hover:text-emerald-800">編集</button>`;
    
    // リスナーを再設定
    setupEventDetailListeners();
}

// (★修正) イベント詳細画面のリスナー設定
function setupEventDetailListeners() {
    try {
        const birdNameInput = document.getElementById('bird_name_input');
        const addBirdButton = document.getElementById('addBirdButton');
        
        // --- 鳥追加フォームのリスナー ---
        if (birdNameInput) {
            birdNameInput.addEventListener('input', (e) => {
                const text = e.target.value;
                const suggestions = getSearchSuggestions(text); // 図鑑と同じ予測候補関数を使用
                renderEventBirdSuggestions(suggestions);
            });
        }
        
        if (addBirdButton) {
            addBirdButton.onclick = handleAddBirdToEvent;
        }

        // --- イベント詳細アコーディオンのリスナー ---
        const accordionHeader = document.getElementById('event-details-header');
        if (accordionHeader) {
            // ヘッダー全体（ボタン以外）のクリックで開閉
            accordionHeader.onclick = (e) => {
                // ボタン（編集/保存/中止）自身がクリックされた場合はトグルしない
                if (!e.target.closest('#event-edit-controls')) {
                    toggleEventAccordion(accordionHeader);
                }
            };
        }

        // --- 編集/保存/中止ボタンのリスナー ---
        if (appState.isEditing) {
            const saveBtn = document.getElementById('saveEventButton');
            const cancelBtn = document.getElementById('cancelEditEventButton');
            if (saveBtn) saveBtn.onclick = handleSaveEvent;
            if (cancelBtn) cancelBtn.onclick = handleCancelEditEvent;
        } else {
            const editBtn = document.getElementById('editEventButton');
            if (editBtn) editBtn.onclick = handleEditEvent;
        }

    } catch (error) {
        console.error("Error setting up event detail listeners:", error);
    }
}

// (★修正) イベントに鳥を追加する処理
function handleAddBirdToEvent() {
    try {
        const nameInput = document.getElementById('bird_name_input');
// ... (既存のコード ... 変更なし) ...
        
        if (!name) {
            // (★変更) カスタムアラートの代わりに console.warn を使用
            console.warn("鳥の名前が入力されていません。");
            return;
        }
        
        event.observedBirds.push({ name, count, seen, heard });
        
        // ★ 変更の即時保存
        saveEventsData();
        
        const tableBody = document.getElementById('observed-birds-table');
        if (tableBody) {
            tableBody.innerHTML = renderObservedBirdsTable();
        } else {
            console.error("Observed birds table body not found.");
        }
        
        nameInput.value = '';
        countInput.value = '1';
        seenInput.checked = false;
        heardInput.checked = false;
    } catch(error) {
        console.error("Error adding bird to event:", error);
    }
}
