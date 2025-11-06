// --- 説明書ページ ---
function showManualPage() { 
    // appState や app, updateHeader は app.js で定義されているグローバル変数・関数
    
    appState.currentPage = 'manual'; 
    appState.isEditing = false;
    
    // (後で内容をここに追加)
    const manualHtml = `
        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-xl font-semibold mb-4">説明書</h2>
            
            <p class="text-gray-700">
                このアプリの使い方についての説明は、ここに記述されます。
            </p>
            
            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">図鑑タブ</h3>
            <p class="text-gray-700">
                鳥の情報を閲覧・編集できます。
            </p>

            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">イベントタブ</h3>
            <p class="text-gray-700">
                観察イベントを作成し、見つけた鳥を記録できます。
            </p>
            
            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">設定タブ</h3>
            <p class="text-gray-700">
                バーダーカードの編集、データのインポート/エクスポートなどが行えます。
            </p>
        </div>
    `;
    
    app.innerHTML = manualHtml;
    updateHeader('manual', '説明書'); 
}