// settings.js (フォントサイズ変更時の高さ自動調整版)

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

    // --- 2. 自分のバーダーカード ---
    const myCard = appState.settings; 
    const myPhotoUrl = myCard.birderPhoto || './favicon3.png';

    const isPlaceholder = !myCard.birderPhoto;
    const buttonIcon = isPlaceholder 
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`;
    
    const buttonTitle = isPlaceholder ? "写真を追加" : "写真を再編集";

    const myBirderCardHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-3">マイ・バーダーカード</h2>
            
            <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg mb-4">
                <div class="relative flex-shrink-0">
                    <img id="birder-photo-preview" src="${myPhotoUrl}" 
                         onerror="this.onerror=null; this.src='https://placehold.co/150x150/e0e0e0/b0b0b0?text=Error';"
                         class="w-20 h-20 object-cover rounded-full border-2 border-emerald-500">
                    <button id="adjust-birder-photo-btn" 
                            class="absolute -top-1 -right-1 bg-white border border-gray-300 text-gray-600 p-1 rounded-full hover:bg-gray-100 hover:text-emerald-600 transition-colors" 
                            title="${buttonTitle}">
                        ${buttonIcon}
                    </button>
                </div>
                <div class="flex-1 min-w-0">
                    <label for="birder-name-input" class="sr-only">あなたの名前</label>
                    <input type="text" id="birder-name-input" value="${escapeHTML(myCard.birderName || '')}" placeholder="あなたの名前" class="w-full text-base font-bold text-gray-800 border-b border-gray-300 focus:border-emerald-500 focus:outline-none">
                    <p class="text-xs text-gray-600 mt-1">ライフリスト: ${liferTotals.any} 種</p>
                </div>
            </div>

            <div class="grid grid-cols-4 gap-2 text-center mt-3 mb-4">
                <div><p class="text-xs font-medium text-gray-500">目視</p><p class="text-lg font-semibold text-emerald-700">${liferTotals.seen}</p></div>
                <div><p class="text-xs font-medium text-gray-500">声</p><p class="text-lg font-semibold text-emerald-700">${liferTotals.heard}</p></div>
                <div><p class="text-xs font-medium text-gray-500">写真</p><p class="text-lg font-semibold text-emerald-700">${liferTotals.photo}</p></div>
                <div><p class="text-xs font-medium text-gray-500">動画</p><p class="text-lg font-semibold text-emerald-700">${liferTotals.video}</p></div>
            </div>

            <div class="space-y-3">
                <div>
                    <label for="birder-link-hp" class="block text-sm font-medium text-gray-700">HP / Webサイト</label>
                    <input type="url" id="birder-link-hp" value="${escapeHTML(myCard.socialLinks.hp || '')}" placeholder="https://..." class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label for="birder-link-x" class="block text-sm font-medium text-gray-700">X (Twitter)</label><input type="text" id="birder-link-x" value="${escapeHTML(myCard.socialLinks.x || '')}" placeholder="@username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></div>
                    <div><label for="birder-link-bluesky" class="block text-sm font-medium text-gray-700">Bluesky</label><input type="text" id="birder-link-bluesky" value="${escapeHTML(myCard.socialLinks.bluesky || '')}" placeholder="@username.bsky.social" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></div>
                    <div><label for="birder-link-instagram" class="block text-sm font-medium text-gray-700">Instagram</label><input type="text" id="birder-link-instagram" value="${escapeHTML(myCard.socialLinks.instagram || '')}" placeholder="username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></div>
                    <div><label for="birder-link-threads" class="block text-sm font-medium text-gray-700">Threads</label><input type="text" id="birder-link-threads" value="${escapeHTML(myCard.socialLinks.threads || '')}" placeholder="@username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"></div>
                </div>
                <div>
                    <label for="birder-comment" class="block text-sm font-medium text-gray-700">コメント</label>
                    <textarea id="birder-comment" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500" placeholder="よろしくお願いします！">${escapeHTML(myCard.birderComment || '')}</textarea>
                </div>
            </div>
            
            <hr class="my-6 border-gray-100 px-4">       
     
            <div class="space-y-3">
                <button id="share-card-btn" class="w-full bg-pink-200 text-pink-800 font-bold py-3 px-4 rounded-lg shadow hover:bg-pink-300 transition-colors">
                    カードを送る (共有)
                </button>
                <p class="text-xs text-gray-500 text-center">
                    ${(navigator.share) ? 'LINEやAirDropでカードを送れます。' : '(お使いのブラウザは共有機能非対応です。ファイルとしてダウンロードします)'}
                </p>
            </div>
        </div>
    `;

    // --- 3. もらったカード ---
    const receivedCardsHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">もらったカード</h2>
            
            <div>
                <label for="import-card-file" class="w-full text-center block bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg shadow-inner hover:bg-gray-100 transition-colors cursor-pointer">
                    カードを読み込む (.json)
                    <input type="file" id="import-card-file" accept=".json, .bcard, application/json" class="hidden">
                </label>
                <p class="text-xs text-gray-500 mt-2">受信したカードデータ (.json) を選択してください。</p>
            </div>
            
            <hr class="my-6 border-gray-100 px-4">

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

    // --- 4. ライフリスト設定 ---
    const autoUpdateChecked = appState.settings.autoUpdateLiferList ? 'checked' : '';
    const liferSettingsHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">ライフリスト設定</h2>
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <label for="auto-update-lifer" class="flex flex-col flex-1 mr-4">
                        <span class="font-medium text-gray-700">イベントから自動更新</span>
                        <span class="text-sm text-gray-500">イベントで鳥を登録時、自動でライフリストをONにします。</span>
                        <input type="checkbox" id="auto-update-lifer" class="hidden" ${autoUpdateChecked}>
                    </label>
                    <button type="button" id="auto-update-lifer-toggle" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${autoUpdateChecked ? 'bg-emerald-600' : 'bg-gray-200'}">
                        <span class="sr-only">自動更新を切り替え</span>
                        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${autoUpdateChecked ? 'translate-x-6' : 'translate-x-1'}"></span>
                    </button>
                </div>
                <hr class="border-gray-100">
                <div>
                    <p class="block text-sm font-medium text-gray-700">ライフリスト再集計</p>
                    <p class="text-sm text-gray-500 mb-3">
                        過去の全イベント履歴をスキャンし、ライフリスト（目視、声など）を更新します。
                    </p>
                    <button id="rescan-lifer-btn" class="w-full bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg shadow hover:bg-yellow-600 transition-colors">
                        イベント履歴からライフリストを追加
                    </button>
                </div>
            </div>
        </div>
    `;

    // --- 5. 背景設定 ---
    const currentFontSize = appState.settings.fontSize || 16;
    const fontSizeHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">表示設定</h2>
            <div class="space-y-4">
                <div>
                    <label for="font-size-slider" class="block text-sm font-medium text-gray-700">
                        基本の文字サイズ: <span id="font-size-value">${currentFontSize}</span> px
                    </label>
                    <input type="range" id="font-size-slider" min="12" max="24" step="1" value="${currentFontSize}" class="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                </div>
            </div>
        </div>
    `;

    const defaultBgSettings = { bgColor: '#f3f4f6', bgImage: '', bgOpacity: 0.1 };
    let currentBgSettings;
    try {
        const storedSettings = localStorage.getItem('birdAppBackground');
        currentBgSettings = storedSettings ? { ...defaultBgSettings, ...JSON.parse(storedSettings) } : defaultSettings;
    } catch (e) {
        currentBgSettings = defaultBgSettings;
    }
    const backgroundSettingsHtml = `
        <div class="bg-white rounded-lg shadow p-4">
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

    // --- 6. インポート/エクスポート ---
    const importExportHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">観察記録のエクスポート (CSV)</h2>
            <p class="text-gray-600 mb-4">
                すべてのイベントと、それに紐づく観察記録をCSVファイルとしてダウンロードします。
            </p>
            <button id="export-csv-btn" class="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-cyan-700 transition-colors">
                観察記録CSVをダウンロード
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">データのエクスポート</h2>
            <p class="text-gray-600 mb-4">
                現在のすべてのデータをバックアップファイル（.json）としてダウンロードします。
            </p>
            <button id="export-data-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
                エクスポート実行
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4 text-red-700">データのインポート</h2>
            <p class="text-gray-600 mb-4">
                バックアップファイル（.json）からデータを復元します。<br>
                <strong class="font-medium text-red-600">注意: </strong>
                <ul class="list-disc list-inside text-sm text-gray-600 ml-2">
                    <li>図鑑データ: インポート元が空でなければ上書き、空なら維持します。</li>
                    <li>イベント履歴: 統合（マージ）されます。</li>
                </ul>
            </p>
            <label for="import-data-file" class="sr-only">バックアップファイルを選択</label>
            <input type="file" id="import-data-file" accept=".json, application/json" class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100">
            <button id="import-data-btn" class="mt-4 w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed" disabled>
                インポート実行
            </button>
        </div>
    `;

    // --- 7. メンテナンス ---
    const maintenanceHtml = `
        <div class="bg-white rounded-lg shadow p-4 mt-4">
            <h2 class="text-xl font-semibold mb-4 text-blue-700">アプリのメンテナンス</h2>
            <p class="text-gray-600 mb-3">
                画面の表示がおかしい場合は、以下のボタンを押してください。
            </p>
            <button id="force-update-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors flex justify-center items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                最新バージョンに更新
            </button>
            <div class="text-xs text-gray-500 mt-2 space-y-1">
                <p>※キャッシュを削除して再読み込みします。登録データは消えません。</p>
            </div>
        </div>
    `;

    // --- 画面全体の描画 ---
    app.innerHTML = `
        <div class="space-y-2 p-2">
            
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <button id="accordion-toggle-font" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-gray-800">文字サイズ・背景</h2>
                    <svg id="accordion-arrow-font" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-font" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-gray-100 space-y-2 p-2">
                        ${fontSizeHtml}
                        ${backgroundSettingsHtml}
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <button id="accordion-toggle-card" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-gray-800">バーダーカード</h2>
                    <svg id="accordion-arrow-card" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-card" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-gray-100 space-y-2 p-2">
                        ${myBirderCardHtml}
                        ${receivedCardsHtml}
                    </div>
                </div>
            </div> 
            
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <button id="accordion-toggle-data" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-gray-800">データ管理</h2>
                    <svg id="accordion-arrow-data" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-data" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-gray-100 space-y-2 p-2">
                        ${liferSettingsHtml}
                        ${importExportHtml}
                        ${maintenanceHtml}
                    </div>
                </div>
            </div>

        </div>`;

    // 下部の余白確保
    app.style.paddingBottom = '10rem';

    updateHeader('settings', '設定');
    
    // --- リスナー設定 ---
    setTimeout(() => {
        try {
            // アコーディオン開閉ロジック (余白追加版)
            const toggleAccordion = (contentId, arrowId) => {
                const content = document.getElementById(contentId);
                const arrow = document.getElementById(arrowId);
                if (!content || !arrow) return;
                
                const currentMaxHeight = content.style.maxHeight;

                if (currentMaxHeight !== '0px' && currentMaxHeight !== '') {
                    content.style.maxHeight = '0px';
                    arrow.classList.remove('arrow-up');
                } else {
                    // ★ 高さ計算にバッファを追加 (+100px)
                    content.style.maxHeight = (content.scrollHeight > 0 ? content.scrollHeight + 100 : 600) + 'px';
                    arrow.classList.add('arrow-up');
                }
            };

            const dataContent = document.getElementById('accordion-content-data');
            if (dataContent) {
                const _ = dataContent.scrollHeight; 
            }

            const fontToggle = document.getElementById('accordion-toggle-font');
            if(fontToggle) fontToggle.onclick = () => toggleAccordion('accordion-content-font', 'accordion-arrow-font');

            const cardToggle = document.getElementById('accordion-toggle-card');
            if (cardToggle) cardToggle.onclick = () => toggleAccordion('accordion-content-card', 'accordion-arrow-card');
            
            const dataToggle = document.getElementById('accordion-toggle-data');
            if (dataToggle) dataToggle.onclick = () => toggleAccordion('accordion-content-data', 'accordion-arrow-data');

            // --- バーダーカード ---
            const nameInput = document.getElementById('birder-name-input');
            const photoPreview = document.getElementById('birder-photo-preview');
            const shareCardBtn = document.getElementById('share-card-btn');
            const adjustBirderPhotoBtn = document.getElementById('adjust-birder-photo-btn');

            if (nameInput) {
                nameInput.onchange = (e) => { 
                    appState.settings.birderName = e.target.value;
                    saveListControlsState(); 
                };
            }
            if (adjustBirderPhotoBtn && photoPreview) {
                adjustBirderPhotoBtn.onclick = () => {
                    const currentImage = appState.settings.birderPhoto; 
                    const saveCroppedImage = (base64Image) => {
                        appState.settings.birderPhoto = base64Image;
                        saveListControlsState(); 
                        photoPreview.src = base64Image;
                        adjustBirderPhotoBtn.title = "写真を再編集";
                        adjustBirderPhotoBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`;
                    };
                    const deleteCroppedImage = () => {
                        appState.settings.birderPhoto = ''; 
                        saveListControlsState(); 
                        photoPreview.src = 'https://placehold.co/150x150/e0e0e0/b0b0b0?text=No+Image';
                        adjustBirderPhotoBtn.title = "写真を追加";
                        adjustBirderPhotoBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`;
                    };

                    if (currentImage) {
                        showCropperModal(currentImage, saveCroppedImage, deleteCroppedImage);
                    } else {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { 
                                showCustomConfirm("画像サイズが5MBを超えています。", "OK", true);
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                showCropperModal(event.target.result, saveCroppedImage, null);
                            };
                            reader.readAsDataURL(file);
                        };
                        fileInput.click();
                    }
                };
            }
            if (shareCardBtn) {
                shareCardBtn.onclick = () => handleShareMyCard(liferTotals);
            }

            const socialInputs = [ {id:'birder-link-hp', k:'hp'}, {id:'birder-link-x', k:'x'}, {id:'birder-link-bluesky', k:'bluesky'}, {id:'birder-link-instagram', k:'instagram'}, {id:'birder-link-threads', k:'threads'} ];
            socialInputs.forEach(i => {
                const el = document.getElementById(i.id);
                if(el) el.onchange = (e) => { appState.settings.socialLinks[i.k] = e.target.value; saveListControlsState(); };
            });
            const commentInput = document.getElementById('birder-comment');
            if(commentInput) commentInput.onchange = (e) => { appState.settings.birderComment = e.target.value; saveListControlsState(); };

            // もらったカード
            const importCardFile = document.getElementById('import-card-file');
            const receivedList = document.getElementById('received-cards-list');
            if (importCardFile) importCardFile.onchange = handleImportReceivedCard;
            if (receivedList) {
                receivedList.onclick = (e) => {
                    const deleteBtn = e.target.closest('[data-action="delete"]');
                    if (deleteBtn) {
                        const cardElement = e.target.closest('[data-card-id]');
                        if (cardElement) handleDeleteReceivedCard(cardElement.dataset.cardId);
                    }
                };
            }

            // エクスポート/インポート/CSV
            const exportCsvBtn = document.getElementById('export-csv-btn');
            if (exportCsvBtn) exportCsvBtn.onclick = handleExportCsvData;
            
            const exportBtn = document.getElementById('export-data-btn');
            const importFile = document.getElementById('import-data-file');
            const importBtn = document.getElementById('import-data-btn');
            if (exportBtn) exportBtn.onclick = handleExportData;
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
                    if (importFile.files.length > 0) handleImportData(importFile.files[0]);
                };
            }

            // メンテナンス
            const forceUpdateBtn = document.getElementById('force-update-btn');
            if (forceUpdateBtn) {
                forceUpdateBtn.onclick = async () => {
                    if (!navigator.onLine) {
                        await showCustomConfirm("エラー：インターネットに接続されていません。", "OK", true);
                        return;
                    }
                    if (!(await showCustomConfirm("アプリの修復を行います。\n実行しますか？", "更新を実行"))) return;

                    forceUpdateBtn.disabled = true;
                    forceUpdateBtn.innerHTML = `更新処理中...`;
                    forceUpdateBtn.classList.add('opacity-50', 'cursor-not-allowed');

                    try {
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            for (const r of registrations) await r.unregister();
                        }
                        const cacheKeys = await caches.keys();
                        for (const key of cacheKeys) await caches.delete(key);
                        await showCustomConfirm("キャッシュを削除しました。\nOKを押すと再読み込みします。", "OK", true);
                        window.location.reload(true);
                    } catch (error) {
                        await showCustomConfirm("更新に失敗しました。", "OK", true);
                        forceUpdateBtn.disabled = false;
                        forceUpdateBtn.textContent = "最新バージョンに更新";
                        forceUpdateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                };
            }

            // ライフリスト
            const autoUpdateToggle = document.getElementById('auto-update-lifer-toggle');
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
            const rescanBtn = document.getElementById('rescan-lifer-btn');
            if (rescanBtn) rescanBtn.onclick = handleRescanLiferList;

            // 背景設定
            const bgColorPicker = document.getElementById('bg-color-picker');
            const bgImageInput = document.getElementById('bg-image-input');
            const bgRemoveBtn = document.getElementById('bg-remove-image-btn');
            const bgOpacitySlider = document.getElementById('bg-opacity-slider');
            const bgOpacityValue = document.getElementById('bg-opacity-value');

            if (bgColorPicker) bgColorPicker.onchange = (e) => saveBackgroundSettings({ bgColor: e.target.value });
            if (bgOpacitySlider && bgOpacityValue) {
                bgOpacitySlider.oninput = (e) => {
                    bgOpacityValue.textContent = e.target.value;
                    saveBackgroundSettings({ bgOpacity: parseFloat(e.target.value) });
                };
            }
            if (bgRemoveBtn) {
                bgRemoveBtn.onclick = async () => {
                    if (await showCustomConfirm('背景画像を削除しますか？', '削除')) {
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
                    if (file.size > 30 * 1024 * 1024) { 
                        showCustomConfirm("画像サイズが30MBを超えています。", "OK", true);
                        e.target.value = null;
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        saveBackgroundSettings({ bgImage: event.target.result }); 
                        bgRemoveBtn.classList.remove('hidden');
                    };
                    reader.readAsDataURL(file);
                };
            }

            // ★ フォントサイズスライダー（変更時にアコーディオン高さを再計算）
            const fontSlider = document.getElementById('font-size-slider');
            const fontValue = document.getElementById('font-size-value');
            if (fontSlider && fontValue) {
                fontSlider.oninput = (e) => {
                    const newSize = parseInt(e.target.value, 10);
                    fontValue.textContent = newSize;
                    applyFontSize(newSize);
                    
                    // ★ 開いているアコーディオンの高さを再計算する
                    document.querySelectorAll('.accordion-content').forEach(content => {
                        if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                            content.style.maxHeight = (content.scrollHeight + 100) + 'px';
                        }
                    });
                };
            }

        } catch (error) {
            console.error("Error setting up settings page listeners:", error);
        }
    }, 0);
}

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

// --- データのエクスポート (ダウンロードのみ) ---
// --- ★追加: エクスポート用に画像を圧縮するヘルパー関数 ---
function compressImageForExport(base64Str, maxWidth = 1024, quality = 0.85) {
    return new Promise((resolve) => {
        // 画像がない、またはBase64でない場合はそのまま返す
        if (!base64Str || !base64Str.startsWith('data:image')) {
            resolve(base64Str);
            return;
        }

        const img = new Image();
        img.onload = () => {
            // サイズ調整（アスペクト比維持）
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxWidth) {
                if (width > height) {
                    height *= maxWidth / width;
                    width = maxWidth;
                } else {
                    width *= maxWidth / height;
                    height = maxWidth;
                }
            } else {
                // すでに小さい画像なら圧縮せずそのまま返す（画質劣化防止）
                resolve(base64Str);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // スマホ用に圧縮 (JPEG 0.85)
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = () => {
            // エラー時は元のデータを返す
            resolve(base64Str);
        };
        img.src = base64Str;
    });
}

// --- 修正版: データのエクスポート (圧縮処理付き) ---
async function handleExportData() {
    console.log('データのエクスポートを開始します...');
    
    // PCかどうかでメッセージを分岐（PCの場合のみ圧縮の案内を出すなど）
    const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
    const confirmMsg = isElectron 
        ? 'データをエクスポートしますか？\n（PC内の高画質データはそのまま残し、スマホ用に画像を自動圧縮して出力します）'
        : 'データをエクスポートしますか？';

    if (!(await showCustomConfirm(confirmMsg, 'エクスポート実行'))) return;

    // ローディング表示（圧縮に時間がかかるため必須）
    showLoadingMessage("エクスポート用データを生成中...\n(画像の圧縮を行っています)");

    try {
        const db = await openBirdDB();
        const originalBirds = await db.getAll(STORE_BIRDS);
        const events = await db.getAll(STORE_EVENTS);
        const receivedCardsData = await db.getAll(STORE_CARDS);
        const settings = JSON.parse(localStorage.getItem('birdListControls') || '{}');
        const backgroundSettings = JSON.parse(localStorage.getItem('birdAppBackground') || '{}');
        
        // --- ★ここが変更点: 鳥データをループして画像を圧縮 ---
        const compressedBirds = [];
        
        // 全鳥データを処理（Promise.allだとメモリ食うのでforループで1つずつ処理）
        for (let i = 0; i < originalBirds.length; i++) {
            const bird = { ...originalBirds[i] }; // コピーを作成
            
            // 写真があれば圧縮
            if (bird.photo_url) {
                // スマホ用に1024px, 画質0.85に変換
                bird.photo_url = await compressImageForExport(bird.photo_url, 1024, 0.85);
            }
            
            compressedBirds.push(bird);
            
            // 進捗状況をログに出す（任意）
            if (i % 10 === 0) console.log(`Processing images: ${i}/${originalBirds.length}`);
        }
        
        // 自分自身のバーダーカードの写真も圧縮
        const compressedSettings = { ...settings };
        if (compressedSettings.birderPhoto) {
            compressedSettings.birderPhoto = await compressImageForExport(compressedSettings.birderPhoto, 500, 0.8);
        }

        // 圧縮済みのデータでバックアップオブジェクトを作成
        const backupData = {
            birds: compressedBirds, // ここに圧縮版を入れる
            events: events,
            receivedCards: receivedCardsData, 
            settings: compressedSettings, 
            backgroundSettings: backgroundSettings, 
            exportDate: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(backupData); 
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        
        // ファイル名を少し変えて区別しやすくする
        a.download = `bird-pokedex-mobile-export-${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('エクスポートが完了しました。');
        
        // 画面を元に戻す
        showSettingsPage();
        await showCustomConfirm('エクスポートが完了しました。\nこのファイルはスマホでも安全に読み込めます。', 'OK', true);

    } catch (error) {
        console.error(error);
        showSettingsPage();
        await showCustomConfirm(`エクスポートに失敗しました。\nエラー: ${error.message}`, 'OK', true);
    }
}

// --- データのインポート (スマートマージ) ---
async function handleImportData(file) {
    if (!file) return;
    if (!(await showCustomConfirm('インポートしますか？\n・図鑑: 空欄なら維持\n・イベント: 統合', 'インポート実行'))) {
        const fileInput = document.getElementById('import-data-file');
        if(fileInput) fileInput.value = null;
        const btn = document.getElementById('import-data-btn');
        if(btn) { btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
        return;
    }

    showLoadingMessage("データをインポート中...");
    
    // ★追加: PC版かどうかの判定
    const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const backupData = JSON.parse(event.target.result);
            if (!backupData || !Array.isArray(backupData.birds) || !Array.isArray(backupData.events)) throw new Error('形式が無効です。');

            const db = await openBirdDB();
            const birdTx = db.transaction(STORE_BIRDS, 'readwrite');
            for (const importBird of backupData.birds) {
                const existingBird = await birdTx.store.get(importBird.id);
                if (existingBird) {
                    const preserveKeys = ['photo_url', 'voice_url', 'description', 'observed_date', 'observed_location', 'special_notes'];
                    preserveKeys.forEach(key => {
                        if (!importBird[key] && existingBird[key]) importBird[key] = existingBird[key];
                    });

                    // ★追加: PC版限定の高画質保護ルール
                    // PC版ですでに写真が登録されている場合は、インポートデータ（スマホの圧縮画像など）で上書きしない
                    if (isElectron && existingBird.photo_url) {
                        importBird.photo_url = existingBird.photo_url;
                    }
                }
                await birdTx.store.put(importBird);
            }
            await birdTx.done;
            
            const eventTx = db.transaction(STORE_EVENTS, 'readwrite');
            for (const ev of backupData.events) {
                const existing = await eventTx.store.get(ev.id);
                if (!existing) await eventTx.store.add(ev);
            }
            await eventTx.done;
            
            await db.clear(STORE_CARDS);
            if (backupData.receivedCards && Array.isArray(backupData.receivedCards)) {
                 const cardTx = db.transaction(STORE_CARDS, 'readwrite');
                 await Promise.all(backupData.receivedCards.map(card => cardTx.store.put(card)));
                 await cardTx.done;
            }

            if (backupData.settings) localStorage.setItem('birdListControls', JSON.stringify(backupData.settings));
            if (backupData.backgroundSettings) localStorage.setItem('birdAppBackground', JSON.stringify(backupData.backgroundSettings));

            await initializeDatabase(); 
            loadListControlsState();    
            applyBackgroundSettings(); 
            showListPage(); 
            await showCustomConfirm('インポート（統合）が完了しました。', 'OK', true);
        } catch (error) {
            showListPage(); 
            await showCustomConfirm(`失敗: ${error.message}`, 'OK', true);
        }
    };
    reader.readAsText(file);
}

// --- CSVエクスポート (ダウンロードのみ) ---
async function handleExportCsvData() {
    try {
        if (!birdEvents || birdEvents.length === 0) {
            await showCustomConfirm("エクスポートするイベントがありません。", "OK", true);
            return;
        }
        const headers = ["EventID", "EventName", "EventDateTime", "EventWeather", "EventLocation", "EventCompanions", "EventMemo", "ObservedBirdName", "ObservedCount", "ObservedSeen", "ObservedHeard", "ObservedPhoto", "ObservedVideo"];
        const csvData = [headers];
        for (const event of birdEvents) {
            const eventBase = [event.id || '', event.name || '', event.dateTime || '', event.weather || '', event.location || '', event.companions || '', (event.memo || '').replace(/\n/g, ' ')];
            if (event.observedBirds && event.observedBirds.length > 0) {
                for (const bird of event.observedBirds) {
                    csvData.push([...eventBase, bird.name || '', bird.count || 1, bird.seen || false, bird.heard || false, bird.photo || false, bird.video || false]);
                }
            } else {
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
    } catch (error) {
        await showCustomConfirm(`CSVエクスポート失敗: ${error.message}`, 'OK', true);
    }
}

// --- ライフリスト再集計 ---
async function handleRescanLiferList() {
    if (!(await showCustomConfirm('イベント履歴からライフリストを再集計しますか？', '実行'))) return;
    showLoadingMessage("再集計中...");
    try {
        let updatedCount = 0;
        let birdDataNeedsSave = false;
        for (const event of birdEvents) {
            for (const observedBird of event.observedBirds) {
                const birdInDB = birdDatabase.find(b => b.name === observedBird.name);
                if (birdInDB) {
                    let updated = false;
                    if (observedBird.seen && !birdInDB.lifer_seen) { birdInDB.lifer_seen = true; updated = true; }
                    if (observedBird.heard && !birdInDB.lifer_heard) { birdInDB.lifer_heard = true; updated = true; }
                    if (observedBird.photo && !birdInDB.lifer_photo) { birdInDB.lifer_photo = true; updated = true; }
                    if (observedBird.video && !birdInDB.lifer_video) { birdInDB.lifer_video = true; updated = true; }
                    if(updated) { birdDataNeedsSave = true; updatedCount++; }
                }
            }
        }
        if (birdDataNeedsSave) await saveDatabase();
        showSettingsPage();
        await showCustomConfirm(`完了。${updatedCount}件更新されました。`, 'OK', true);
    } catch (error) {
        showSettingsPage(); 
        await showCustomConfirm(`エラー: ${error.message}`, 'OK', true);
    }
}

// --- カード共有 (シェア機能) ---
async function handleShareMyCard(liferTotals) {
    const myCardData = {
        type: 'BirdPokedexCard', version: 1, 
        name: appState.settings.birderName || '名無しのバーダー',
        photo: appState.settings.birderPhoto || '',
        totals: liferTotals,
        socialLinks: appState.settings.socialLinks || {},
        comment: appState.settings.birderComment || '',
        exportedDate: new Date().toISOString()
    };
    const jsonString = JSON.stringify(myCardData);
    const fileName = `birder-card-${(appState.settings.birderName || 'user').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    const file = new File([jsonString], fileName, { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ title: '私のバーダーカード', text: `${myCardData.name}さんのバーダーカードです。`, files: [file] });
        } catch (error) {
            if (error.name !== 'AbortError') handleExportMyCardFallback(file);
        }
    } else {
        handleExportMyCardFallback(file);
    }
}

function handleExportMyCardFallback(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function migrateReceivedCardData(cardData) {
    const defaultV1Card = { name: '（名前なし）', photo: '', totals: { seen: 0, heard: 0, photo: 0, video: 0, any: 0 }, socialLinks: { hp: '', x: '', bluesky: '', instagram: '', threads: '' }, comment: '' };
    return { ...defaultV1Card, ...cardData };
}

async function handleImportReceivedCard(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const cardData = JSON.parse(e.target.result);
            if (!cardData || cardData.type !== 'BirdPokedexCard') throw new Error('無効なファイルです。');
            const newCard = { ...migrateReceivedCardData(cardData), id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, receivedDate: new Date().toISOString() };
            receivedCards.push(newCard);
            await saveReceivedCards();
            showSettingsPage();
            await showCustomConfirm(`${escapeHTML(newCard.name)}さんのカードを読み込みました！`, 'OK', true);
        } catch (error) {
            await showCustomConfirm(`読み込み失敗: ${error.message}`, 'OK', true);
        } finally { event.target.value = null; }
    };
    reader.readAsText(file);
}

async function handleDeleteReceivedCard(cardId) {
    if (!cardId) return;
    const cardIndex = receivedCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    if (await showCustomConfirm(`${escapeHTML(receivedCards[cardIndex].name)}さんのカードを削除しますか？`, '削除')) {
        receivedCards.splice(cardIndex, 1);
        await saveReceivedCards();
        showSettingsPage();
    }
}