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
    const newEventBtn = document.getElementById('newEventButton');
    if (newEventBtn) newEventBtn.onclick = showNewEventForm; 
    else console.error("New event button not found");
}

// --- 新規イベント作成画面 ---
function showNewEventForm() { 
    appState.currentPage = 'newEvent'; 
    let newEventData = { id: Date.now().toString(), name: '', dateTime: new Date().toISOString().slice(0, 16).replace('T', ' '), weather: '', location: '', companions: '', observedBirds: [] };
    app.innerHTML = `<form id="newEventForm" class="bg-white rounded-lg shadow p-4 space-y-4"><h2 class="text-xl font-bold text-gray-900 mb-2">新規イベント作成</h2><div class="space-y-3"><div><label for="event_name" class="block text-sm font-medium text-gray-700">イベント名</label><input type="text" id="event_name" name="name" value="${escapeHTML(newEventData.name)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 週末の探鳥会"></div><div><label for="event_datetime" class="block text-sm font-medium text-gray-700">日時</label><input type="datetime-local" id="event_datetime" name="dateTime" value="${newEventData.dateTime}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"></div><div><label for="event_weather" class="block text-sm font-medium text-gray-700">天気</label><input type="text" id="event_weather" name="weather" value="${escapeHTML(newEventData.weather)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 晴れ"></div><div><label for="event_location" class="block text-sm font-medium text-gray-700">場所</label><input type="text" id="event_location" name="location" value="${escapeHTML(newEventData.location)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: 〇〇公園"></div><div><label for="event_companions" class="block text-sm font-medium text-gray-700">同行者</label><input type="text" id="event_companions" name="companions" value="${escapeHTML(newEventData.companions)}" class="event-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="例: Aさん, Bさん"></div></div><hr class="my-4"><button type="submit" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">イベントを作成</button></form>`;
    updateHeader('newEvent', '新規イベント');
    setupNewEventFormListeners(newEventData); 
}
function setupNewEventFormListeners(eventData) { 
    const form = document.getElementById('newEventForm'); if (!form) return; 
    form.querySelectorAll('.event-input').forEach(input => input.addEventListener('input', (e) => { 
        if (eventData) eventData[e.target.name] = e.target.value; 
    }));
    form.onsubmit = (e) => handleSaveNewEvent(e, eventData); 
}
function renderEventBirdSuggestions(suggestions) { 
    const box = document.getElementById('bird_name_suggestions'); 
    if (!box) return;
    if (suggestions.length === 0) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = suggestions.map(n => `<div class="event-suggestion-item" data-name="${escapeHTML(n)}">${escapeHTML(n)}</div>`).join('');
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
                </td>
        </tr>`).join('');
} 

// --- 新規イベント保存 ---
function handleSaveNewEvent(event, eventData) { 
    event.preventDefault(); if (!eventData) return;
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
     
     const details = [
         { label: '日時', value: event.dateTime || '(未設定)' },
         { label: '天気', value: event.weather || '(未設定)' },
         { label: '場所', value: event.location || '(未設定)' },
         { label: '同行者', value: event.companions || '(なし)' },
     ];
     const eventDetailsHtml = `
        <div class="bg-white rounded-lg shadow p-4 mb-4">
            <dl class="space-y-2">
                ${details.map(d => `
                    <div>
                        <dt class="text-sm font-medium text-gray-500">${d.label}</dt>
                        <dd class="mt-1 text-sm text-gray-900">${escapeHTML(d.value)}</dd>
                    </div>
                `).join('')}
            </dl>
        </div>`; 
     
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

// (★追加) イベント詳細画面のリスナー設定
function setupEventDetailListeners() {
    try {
        const birdNameInput = document.getElementById('bird_name_input');
        const birdNameSuggestions = document.getElementById('bird_name_suggestions');
        const addBirdButton = document.getElementById('addBirdButton');
        
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
    } catch (error) {
        console.error("Error setting up event detail listeners:", error);
    }
}

// (★追加) イベントに鳥を追加する処理
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
            // (★変更) カスタムアラートの代わりに console.warn を使用
            console.warn("鳥の名前が入力されていません。");
            return;
        }
        
        event.observedBirds.push({ name, count, seen, heard });
        
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