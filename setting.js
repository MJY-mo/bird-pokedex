// --- 設定画面 ---
function showSettingsPage() { 
    appState.currentPage = 'settings'; appState.isEditing = false;
    const lastSync = localStorage.getItem('lastSyncStatus'); const lastSyncTime = lastSync ? new Date(lastSync).toLocaleString('ja-JP') : '同期履歴なし';
    const urlWarning = GITHUB_CSV_URL.includes('[YOUR_USERNAME]') ? `<p class="text-red-600 text-sm font-medium">警告: アプリのURL設定が完了していません。</p>` : '';
    app.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4">データ同期</h2>
                ${urlWarning}
                <div class="space-y-3">
                    <button id="syncDataButton" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors ${urlWarning?'opacity-50 cursor-not-allowed':''}" ${urlWarning?'disabled':''}>
                        今すぐ同期する
                    </button>
                    <p class="text-sm text-gray-500 text-center">最終同期: ${lastSyncTime}</p>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4 text-red-700">データリセット</h2>
                <p class="text-gray-600 mb-4">図鑑の編集内容とイベント履歴が削除されます。</p>
                <button id="clearDataButton" class="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-700 transition-colors">
                    全データ消去
                </button>
            </div>
        </div>`;
    updateHeader('settings', '設定');
    
    try {
        const syncBtn = document.getElementById('syncDataButton'); 
        if (syncBtn) {
             syncBtn.onclick = async () => { 
                syncBtn.disabled = true; syncBtn.textContent = '同期中...'; 
                showLoadingMessage("図鑑データをダウンロード中..."); 
                await fetchCSVAndSave(); 
                loadListControlsState(); 
                showListPage();          
            };
        } else { console.error("Sync button not found"); }
        
        const clearBtn = document.getElementById('clearDataButton');
        if (clearBtn) { clearBtn.onclick = handleClearData; }
        else { console.error("Clear data button not found"); }
    } catch (error) {
        console.error("Error setting up settings page listeners:", error);
    }
}

// --- データ全消去 ---
function handleClearData() { 
    // (★変更) alertの代わりにconfirmを使用し、プロンプト入力を削除
    const confirmation = confirm("本当にすべてのデータ（図鑑の編集内容、イベント履歴）を削除しますか？\nこの操作は元に戻せません。");
    
    if (confirmation) {
        try { 
            localStorage.removeItem('birdDatabase');
            localStorage.removeItem('birdListControls');
            localStorage.removeItem('birdDataVersion');
            localStorage.removeItem('lastSyncStatus');
            localStorage.removeItem('birdEvents'); 
            localStorage.removeItem('birdDatabaseLoadError'); 
            console.log('全データを消去しました。');
        } catch(e) {
            console.error("Error clearing localStorage:", e);
        }
        
        birdDatabase = []; processedBirdList = []; birdEvents = []; 
        updateAllOrdersList(); 
        
        // (★変更) リセット後にコントロールをデフォルトで再読み込み
        loadListControlsState(); 
        
        // 図鑑タブを表示
        showListPage();
        
        // (★変更) タブの表示状態を確実に「図鑑」に戻す
        try {
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.replace('tab-active', 'tab-inactive');
            });
            const pokedexTab = document.getElementById('tab-pokedex');
            if (pokedexTab) {
                pokedexTab.classList.replace('tab-inactive', 'tab-active');
            }
        } catch(e) { 
            console.error("Error switching tab after clear:", e); 
        }
    } else {
        console.log('データ消去をキャンセルしました。');
    }
}