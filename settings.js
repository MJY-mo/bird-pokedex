// --- 設定画面 ---
function showSettingsPage() { 
    appState.currentPage = 'settings'; appState.isEditing = false;
    app.style.paddingBottom = '5rem';
    
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

    // ★ 修正: pokedex.js と同じロジックを適用
    const isPlaceholder = !myCard.birderPhoto;
    const buttonIcon = isPlaceholder 
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>` // 「+」アイコン
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`; // 「鉛筆」アイコン
    
    const buttonTitle = isPlaceholder ? "写真を追加" : "写真を再編集";

    // (余白・はみ出し修正済みのHTML)
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
                <div>
                    <p class="text-xs font-medium text-gray-500">目視</p>
                    <p class="text-lg font-semibold text-emerald-700">${liferTotals.seen}</p>
                </div>
                <div>
                    <p class="text-xs font-medium text-gray-500">声</p>
                    <p class="text-lg font-semibold text-emerald-700">${liferTotals.heard}</p>
                </div>
                <div>
                    <p class="text-xs font-medium text-gray-500">写真</p>
                    <p class="text-lg font-semibold text-emerald-700">${liferTotals.photo}</p>
                </div>
                <div>
                    <p class="text-xs font-medium text-gray-500">動画</p>
                    <p class="text-lg font-semibold text-emerald-700">${liferTotals.video}</p>
                </div>
            </div>

            <div class="space-y-3">
                <div>
                    <label for="birder-link-hp" class="block text-sm font-medium text-gray-700">HP / Webサイト</label>
                    <input type="url" id="birder-link-hp" value="${escapeHTML(myCard.socialLinks.hp || '')}" placeholder="https://..." class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="birder-link-x" class="block text-sm font-medium text-gray-700">X (Twitter)</label>
                        <input type="text" id="birder-link-x" value="${escapeHTML(myCard.socialLinks.x || '')}" placeholder="@username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    <div>
                        <label for="birder-link-bluesky" class="block text-sm font-medium text-gray-700">Bluesky</label>
                        <input type="text" id="birder-link-bluesky" value="${escapeHTML(myCard.socialLinks.bluesky || '')}" placeholder="@username.bsky.social" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    <div>
                        <label for="birder-link-instagram" class="block text-sm font-medium text-gray-700">Instagram</label>
                        <input type="text" id="birder-link-instagram" value="${escapeHTML(myCard.socialLinks.instagram || '')}" placeholder="username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    <div>
                        <label for="birder-link-threads" class="block text-sm font-medium text-gray-700">Threads</label>
                        <input type="text" id="birder-link-threads" value="${escapeHTML(myCard.socialLinks.threads || '')}" placeholder="@username" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
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


    // --- 3. ★★★ もらったカード ★★★ ---
    const receivedCardsHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">もらったカード</h2>
            
            <div>
                <label for="import-card-file" class="w-full text-center block bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-lg shadow-inner hover:bg-gray-100 transition-colors cursor-pointer">
                    カードを読み込む (.bcard)
                    <input type="file" id="import-card-file" accept=".bcard, application/json" class="hidden">
                </label>
                <p class="text-xs text-gray-500 mt-2">受信した '.bcard' ファイルを選択してください。</p>
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


    // --- 4. 既存の機能 (ライフリスト設定など) ---
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
                        （手動でOFFにした項目がONになることはあっても、ONの項目がOFFになることはありません）
                    </p>
                    <button id="rescan-lifer-btn" class="w-full bg-yellow-500 text-gray-800 font-bold py-3 px-4 rounded-lg shadow hover:bg-yellow-600 transition-colors">
                        イベント履歴からライフリストを追加
                    </button>
                </div>
            </div>
        </div>
    `;

    // --- 5. 既存の機能 (背景設定) ---

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
                    <p class="text-xs text-gray-500 mt-1">アプリ全体の文字サイズ基準を変更します。</p>
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

    // --- 6. 既存の機能 (インポート/エクスポート) ---
    const importExportHtml = `
        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">観察記録のエクスポート (CSV)</h2>
            <p class="text-gray-600 mb-4">
                すべてのイベントと、それに紐づく観察記録（鳥の名前、数、確認方法など）をCSVファイルとしてダウンロードします。(1行 = 1観察記録)
            </p>
            <button id="export-csv-btn" class="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-cyan-700 transition-colors">
                観察記録CSVをダウンロード
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4">データのエクスポート</h2>
            <p class="text-gray-600 mb-4">
                現在のすべての図鑑データ（写真・音声含む）とイベント履歴、設定を、一つのバックアップファイル（.json）としてダウンロードします。
            </p>
            <button id="export-data-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
                エクスポート実行
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-xl font-semibold mb-4 text-red-700">データのインポート</h2>
            <p class="text-gray-600 mb-4">
                エクスポートしたバックアップファイル（.json）を選択してください。<br>
                <strong class="font-medium text-red-600">注意: 現在のすべてのデータ（設定含む）は、ファイルの内容で上書きされます。</strong>
            </p>
            
            <label for="import-data-file" class="sr-only">バックアップファイルを選択</label>
            <input type="file" id="import-data-file" accept=".json, application/json" class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100">
            
            <button id="import-data-btn" class="mt-4 w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed" disabled>
                インポート実行
            </button>
        </div>
    `;

    // --- 画面全体の描画 (アコーディオン化) ---
    app.innerHTML = `
        <div class="space-y-2 p-2 overflow-x-hidden">
            
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
                    </div>
                </div>
            </div>

        </div>`;


    updateHeader('settings', '設定');
    
    
    // --- リスナー設定 ---
    setTimeout(() => {
        try {
            // アコーディオン開閉ロジック
            const toggleAccordion = (contentId, arrowId) => {
                const content = document.getElementById(contentId);
                const arrow = document.getElementById(arrowId);
                if (!content || !arrow) {
                    console.error("Accordion elements not found:", contentId, arrowId);
                    return;
                }
                
                const currentMaxHeight = content.style.maxHeight;

                if (currentMaxHeight !== '0px' && currentMaxHeight !== '') {
                    // 閉じる
                    content.style.maxHeight = '0px';
                    arrow.classList.remove('arrow-up');
                } else {
                    // 開く (scrollHeight が 0 の場合のフォールバック を追加)
                    content.style.maxHeight = (content.scrollHeight > 0 ? content.scrollHeight : 500) + 'px';
                    arrow.classList.add('arrow-up');
                }
            };

            const cardToggle = document.getElementById('accordion-toggle-card');
            if (cardToggle) {
                cardToggle.onclick = () => toggleAccordion('accordion-content-card', 'accordion-arrow-card');
            }
            const dataToggle = document.getElementById('accordion-toggle-data');
            if (dataToggle) {
                dataToggle.onclick = () => toggleAccordion('accordion-content-data', 'accordion-arrow-data');
            }


// --- マイ・バーダーカードのリスナー ---
            const nameInput = document.getElementById('birder-name-input');
            // const photoInput = document.getElementById('birder-photo-input'); // ★ 削除
            const photoPreview = document.getElementById('birder-photo-preview');
            // const removePhotoBtn = document.getElementById('birder-remove-photo-btn'); // ★ 削除
            const shareCardBtn = document.getElementById('share-card-btn');
            
            const adjustBirderPhotoBtn = document.getElementById('adjust-birder-photo-btn');

            if (nameInput) {
                nameInput.onchange = (e) => { 
                    appState.settings.birderName = e.target.value;
                    saveListControlsState(); // app.js の関数
                };
            }
            
            // ★ 修正: photoInput と removePhotoBtn のリスナーを削除

            // ★ 修正: adjustBirderPhotoBtn のロジックを pokedex.js と同様に更新
            if (adjustBirderPhotoBtn && photoPreview) {
                adjustBirderPhotoBtn.onclick = () => {
                    
                    const currentImage = appState.settings.birderPhoto; 

                    // 共通の保存コールバック関数
                    const saveCroppedImage = (base64Image) => {
                        appState.settings.birderPhoto = base64Image;
                        saveListControlsState(); // 変更をlocalStorageに保存
                        
                        // プレビュー画像とボタンの表示を更新
                        photoPreview.src = base64Image;
                        
                        adjustBirderPhotoBtn.title = "写真を再編集";
                        adjustBirderPhotoBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`;
                    };
                    
                    // ★ 追加: 削除コールバック関数
                    const deleteCroppedImage = () => {
                        appState.settings.birderPhoto = ''; // ★ 画像を削除
                        saveListControlsState(); // 変更をlocalStorageに保存
                        
                        // プレビューとボタンを更新 (リロードの代わり)
                        photoPreview.src = 'https://placehold.co/150x150/e0e0e0/b0b0b0?text=No+Image';
                        adjustBirderPhotoBtn.title = "写真を追加";
                        adjustBirderPhotoBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`;
                    };

                    if (currentImage) {
                        // 1. 既存画像の場合: そのままCropperに渡す
                        // ★ 修正: 第3引数に deleteCroppedImage (削除あり) を渡す
                        showCropperModal(currentImage, saveCroppedImage, deleteCroppedImage);
                    } else {
                        // 2. プレースホルダーの場合: ファイル選択をトリガー
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.onchange = (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            if (file.size > 5 * 1024 * 1024) { 
                                showCustomConfirm("画像サイズが5MBを超えています。5MB以下のファイルを選択してください。", "OK", true);
                                return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                // 3. 読み込んだ画像をCropperに渡す
                                // ★ 修正: 第3引数に null (削除なし) を渡す
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

            // --- ★ 修正: SNS・コメント入力欄のリスナーを追加 ---
            const socialInputs = [
                { id: 'birder-link-hp', key: 'hp' },
                { id: 'birder-link-x', key: 'x' },
                { id: 'birder-link-bluesky', key: 'bluesky' },
                { id: 'birder-link-instagram', key: 'instagram' },
                { id: 'birder-link-threads', key: 'threads' }
            ];

            socialInputs.forEach(item => {
                const inputElement = document.getElementById(item.id);
                if (inputElement) {
                    inputElement.onchange = (e) => {
                        appState.settings.socialLinks[item.key] = e.target.value;
                        saveListControlsState(); // app.js の関数
                    };
                }
            });

            const commentInput = document.getElementById('birder-comment');
            if (commentInput) {
                commentInput.onchange = (e) => {
                    appState.settings.birderComment = e.target.value;
                    saveListControlsState(); // app.js の関数
                };
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

// --- ★★★ ここから追加 ★★★ ---
            const fontSlider = document.getElementById('font-size-slider');
            const fontValue = document.getElementById('font-size-value');
            const fontAccordionToggle = document.getElementById('accordion-toggle-font'); // 新しいアコーディオンのToggle

            if (fontSlider && fontValue) {
                fontSlider.oninput = (e) => {
                    const newSize = parseInt(e.target.value, 10);
                    fontValue.textContent = newSize;
                    applyFontSize(newSize); // app.js で定義したグローバル関数
                };
            }

            // 新しいアコーディオン(font)のリスナー
            if (fontAccordionToggle) {
                fontAccordionToggle.onclick = () => toggleAccordion('accordion-content-font', 'accordion-arrow-font');
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
            
            // ★★★ 循環参照エラーの修正: settings.js が pokedex.js に依存しているため、
            // この関数は pokedex.js が読み込まれた後に呼び出す必要がある。
            // (index.html の読み込み順で制御)
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
            // ★★★ 循環参照エラーの修正
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


// --- ★★★ 修正: カードの写真変更ハンドラ (Cropper.js を起動) ★★★ ---

// --- ★★★ カードを共有（またはエクスポート）するハンドラ ★★★ ---
async function handleShareMyCard(liferTotals) {
    
    // ★ 修正: バージョン情報を追加
    const myCardData = {
        type: 'BirdPokedexCard', 
        version: 1, 
        name: appState.settings.birderName || '名無しのバーダー',
        photo: appState.settings.birderPhoto || '', // Base64
        totals: liferTotals,
        // ★ 修正: SNSリンクとコメントを追加
        socialLinks: appState.settings.socialLinks || {},
        comment: appState.settings.birderComment || '',
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

// --- ★★★ 新設: もらったカードの移行（マイグレーション）関数 ★★★ ---
/**
 * インポートしたカードデータを、現在のアプリが期待する構造に変換する
 */
function migrateReceivedCardData(cardData) {
    const version = cardData.version || 1; // バージョンがなければV1とみなす
    
    // V1のデフォルト構造
    const defaultV1Card = {
        name: '（名前なし）',
        photo: '',
        totals: { seen: 0, heard: 0, photo: 0, video: 0, any: 0 },
        // ★ 修正: デフォルト値を追加
        socialLinks: { hp: '', x: '', bluesky: '', instagram: '', threads: '' },
        comment: ''
    };

    let migratedData = {};

    if (version === 1) {
        migratedData = {
            name: cardData.name || defaultV1Card.name,
            photo: cardData.photo || defaultV1Card.photo,
            totals: cardData.totals || defaultV1Card.totals,
            // ★ 修正: 読み込み処理を追加
            socialLinks: cardData.socialLinks || defaultV1Card.socialLinks,
            comment: cardData.comment || defaultV1Card.comment
        };
    }
    // else if (version === 2) {
    //   // V2の移行ロジック
    // }
    
    // 不足している可能性のあるキーを、デフォルトで上書きマージする
    return { ...defaultV1Card, ...migratedData };
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

            // データのバリデーション (totalsのチェックは緩める)
            if (!cardData || cardData.type !== 'BirdPokedexCard') {
                throw new Error('これは有効なバーダーカードファイルではありません。');
            }
            
            // ★ 修正: 移行関数を通す
            const migratedCard = migrateReceivedCardData(cardData);

            // スナップショットとして保存（ユニークIDと受信日を追加）
            const newCard = {
                ...migratedCard, // ★ 移行後のデータを使用
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


// --- ★★★ 修正: この関数 (showCropperModal) は app.js に移動しました ★★★ ---
// (ここにあった 649〜716行目 を削除)