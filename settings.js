// --- 設定画面 ---
function showSettingsPage() { 
    appState.currentPage = 'settings'; appState.isEditing = false;
    
    // ★ 機能追加: 現在の背景設定を読み込む
    const defaultBgSettings = { bgColor: '#f3f4f6', bgImage: '', bgOpacity: 0.1 };
    let currentBgSettings;
    try {
        const storedSettings = localStorage.getItem('birdAppBackground');
        currentBgSettings = storedSettings ? { ...defaultBgSettings, ...JSON.parse(storedSettings) } : defaultBgSettings;
    } catch (e) {
        currentBgSettings = defaultBgSettings;
    }

    // ★ 修正: 「同期」「リセット」を削除し、「インポート」「エクスポート」「背景設定」に変更
    app.innerHTML = `
        <div class="space-y-6">
        
            <!-- ★ 機能追加: 背景設定 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">背景設定</h2>
                <div class="space-y-4">
                    <!-- 背景色 -->
                    <div>
                        <label for="bg-color-picker" class="block text-sm font-medium text-gray-700">背景色</label>
                        <input type="color" id="bg-color-picker" value="${escapeHTML(currentBgSettings.bgColor)}" class="mt-1 block w-full h-10 border border-gray-300 rounded-md cursor-pointer">
                    </div>
                    
                    <!-- 背景画像 -->
                    <div>
                        <label for="bg-image-input" class="block text-sm font-medium text-gray-700">背景画像 (5MBまで)</label>
                        <input type="file" id="bg-image-input" accept="image/*" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                        <button type="button" id="bg-remove-image-btn" class="mt-2 text-sm font-medium text-red-600 hover:text-red-800 ${!currentBgSettings.bgImage ? 'hidden' : ''}">
                            背景画像を削除
                        </button>
                    </div>
                    
                    <!-- 画像の透明度 -->
                    <div>
                        <label for="bg-opacity-slider" class="block text-sm font-medium text-gray-700">画像の透明度: <span id="bg-opacity-value">${currentBgSettings.bgOpacity}</span></label>
                        <input type="range" id="bg-opacity-slider" min="0.05" max="1" step="0.05" value="${currentBgSettings.bgOpacity}" class="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                </div>
            </div>

            <!-- ★ 機能追加: データのエクスポート -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">データのエクスポート</h2>
                <p class="text-gray-600 mb-4">
                    現在のすべての図鑑データ（写真・音声含む）とイベント履歴、背景設定を、一つのバックアップファイル（.json）としてダウンロードします。
                </p>
                <button id="export-data-btn" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-700 transition-colors">
                    エクスポート実行
                </button>
            </div>

            <!-- ★ 機能追加: データのインポート -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4 text-red-700">データのインポート</h2>
                <p class="text-gray-600 mb-4">
                    エクスポートしたバックアップファイル（.json）を選択してください。<br>
                    <strong class="font-medium text-red-600">注意: 現在のすべてのデータ（背景設定含む）は、ファイルの内容で上書きされます。</strong>
                </p>
                
                <input type="file" id="import-data-file" accept=".json, application/json" class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100">
                
                <button id="import-data-btn" class="mt-4 w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-colors opacity-50 cursor-not-allowed" disabled>
                    インポート実行
                </button>
            </div>
        </div>`;
    updateHeader('settings', '設定');
    
    // ★ 修正: DOMの描画が完了するのを待つ
    setTimeout(() => {
        try {
            // --- インポート/エクスポートのリスナー ---
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

            // --- ★ 機能追加: 背景設定のリスナー ---
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
                        if (bgImageInput) bgImageInput.value = null; // ファイル選択をリセット
                    }
                };
            }
            if (bgImageInput) {
                bgImageInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) { // 5MB 制限
                        console.warn("画像サイズが5MBを超えています。");
                        showCustomConfirm("画像サイズが5MBを超えています。5MB以下のファイルを選択してください。", "OK", true);
                        e.target.value = null;
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        saveBackgroundSettings({ bgImage: event.target.result }); // Base64を保存
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

// --- ★ 機能追加: 背景設定を保存する関数 ---
function saveBackgroundSettings(newSettings) {
    try {
        const defaultSettings = { bgColor: '#f3f4f6', bgImage: '', bgOpacity: 0.1 };
        let settings;
        
        const storedSettings = localStorage.getItem('birdAppBackground');
        settings = storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings;

        // 新しい設定をマージ
        settings = { ...settings, ...newSettings };
        
        // localStorageに保存
        localStorage.setItem('birdAppBackground', JSON.stringify(settings));
        
        // 即座に背景に適用
        applyBackgroundSettings();

    } catch (e) {
        console.error("Failed to save background settings:", e);
    }
}


// --- ★ 機能追加: データのエクスポート処理 ---
async function handleExportData() {
    console.log('データのエクスポートを開始します...');
    
    try {
        const db = await openBirdDB();
        
        // 1. 全データを IndexedDB から取得
        const birds = await db.getAll(STORE_BIRDS);
        const events = await db.getAll(STORE_EVENTS);
        
        // 2. UI設定を localStorage から取得
        const settings = JSON.parse(localStorage.getItem('birdListControls') || '{}');
        const backgroundSettings = JSON.parse(localStorage.getItem('birdAppBackground') || '{}');
        
        // 3. 1つのオブジェクトにまとめる
        const backupData = {
            birds: birds,
            events: events,
            settings: settings,
            backgroundSettings: backgroundSettings, // ★ 背景設定も追加
            exportDate: new Date().toISOString()
        };
        
        // 4. JSON文字列に変換
        const jsonString = JSON.stringify(backupData); // (容量節約のためインデントなし)
        
        // 5. Blobを作成
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // 6. ダウンロードリンクを作成してクリック
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 日付でファイル名を作成 (例: bird-pokedex-backup-2025-11-03.json)
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `bird-pokedex-backup-${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        // 後片付け
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('エクスポートが完了しました。');

    } catch (error) {
        console.error('エクスポートに失敗しました:', error);
        // カスタムモーダルでエラー表示
        await showCustomConfirm(
            `エクスポートに失敗しました。\nエラー: ${error.message}`,
            'OK',
            true // OKボタンのみ
        );
    }
}

// --- ★ 機能追加: データのインポート処理 ---
async function handleImportData(file) {
    if (!file) return;

    // 1. カスタム確認モーダルで最終確認
    const confirmed = await showCustomConfirm(
        '本当にインポートしますか？\n現在のすべてのデータ（背景設定含む）は、ファイルの内容で上書きされます。この操作は元に戻せません。',
        'インポート実行'
    );

    const importFile = document.getElementById('import-data-file');
    const importBtn = document.getElementById('import-data-btn');

    if (!confirmed) {
        console.log('インポートがキャンセルされました。');
        // ファイル選択をリセット
        if (importFile) importFile.value = null;
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        return;
    }

    console.log('インポート処理を開始します...');
    showLoadingMessage("データをインポート中...");

    // 2. ファイルを読み込む
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonString = event.target.result;
            const backupData = JSON.parse(jsonString);

            // 3. データのバリデーション (settings は必須ではない)
            if (!backupData || !Array.isArray(backupData.birds) || !Array.isArray(backupData.events)) {
                throw new Error('バックアップファイルの形式が無効です。（鳥またはイベントのデータがありません）');
            }

            // 4. IndexedDB をクリア
            const db = await openBirdDB();
            await db.clear(STORE_BIRDS);
            await db.clear(STORE_EVENTS);
            
            // 5. IndexedDB に新しいデータを書き込み
            const birdTx = db.transaction(STORE_BIRDS, 'readwrite');
            await Promise.all(backupData.birds.map(bird => birdTx.store.put(bird)));
            await birdTx.done;
            
            const eventTx = db.transaction(STORE_EVENTS, 'readwrite');
            await Promise.all(backupData.events.map(ev => eventTx.store.put(ev)));
            await eventTx.done;
            
            // 6. localStorage に設定を書き込み
            if (backupData.settings) {
                localStorage.setItem('birdListControls', JSON.stringify(backupData.settings));
            } else {
                localStorage.removeItem('birdListControls'); // 古い設定を削除
            }
            
            // 6b. ★ 機能追加: もし背景設定があれば、それも復元
            if (backupData.backgroundSettings) {
                localStorage.setItem('birdAppBackground', JSON.stringify(backupData.backgroundSettings));
            } else {
                localStorage.removeItem('birdAppBackground'); // 背景設定もリセット
            }


            console.log('インポートが完了しました。アプリを再読み込みします...');
            
            // 7. アプリをリロードして変更を反映
            // (メモリ上の古いデータをクリアするため、initializeDatabase() を呼ぶ)
            await initializeDatabase(); 
            loadListControlsState();    
            
            // ★ 機能追加: インポート後に背景を適用
            applyBackgroundSettings(); // app.js の関数
            
            showListPage(); // 図鑑ページを表示
            
            // UIをリセット
            if (importFile) importFile.value = null;
            if (importBtn) {
                 importBtn.disabled = true;
                 importBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            
            // 完了メッセージ
            await showCustomConfirm(
                'データのインポートが完了しました。',
                'OK',
                true // OKボタンのみ
            );

        } catch (error) {
            console.error('インポート処理中にエラーが発生しました:', error);
            showListPage(); // エラーでもリストページに戻す
            
            await showCustomConfirm(
                `インポートに失敗しました。\nエラー: ${error.message}\n\nファイルが破損していないか、正しいバックアップファイルか確認してください。`,
                'OK',
                true // キャンセルボタンを非表示
            );
        }
    };
    
    reader.onerror = async (error) => {
        console.error('ファイルの読み込みに失敗しました:', error);
        await showCustomConfirm(
            'ファイルの読み込みに失敗しました。',
            'OK',
            true // キャンセルボタンを非表示
        );
    };

    reader.readAsText(file);
}


// --- アプリケーション初期化 (app.js から移動) ---
(async () => { 
    try { 
        // ★ 機能追加: アプリ起動時に背景設定を適用
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
            app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">アプリ起動エラー</strong><span class="block sm:inline">アプリの起動に失敗しました。</span><p class="mt-2">開発者コンソール(F12)で詳細を確認してください。</p></div>`;
        }
        try { updateHeader('error', 'エラー'); } catch(e) { console.error("Failed to update header on error:", e); } 
    }
})();

