// manual.js

// --- 説明書ページ ---
function showManualPage() { 
    // appState や app, updateHeader は app.js で定義されているグローバル変数・関数
    
    appState.currentPage = 'manual'; 
    appState.isEditing = false;
    
    // プラットフォーム判定
    const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    // PWA (ブラウザ) かどうかの判定（上記2つ以外）
    const isPwa = !isElectron && !isNativeApp;

    // --- 1. アプリの使い方 ---
    const usageHtml = `
        <div class="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-semibold mb-4">ようこそ！</h2>
            <p class="text-sm text-gray-600">
                これは、あなたの野鳥観察を記録・管理するために作られた「鳥類図鑑PWA（プログレッシブ・ウェブアプリ）」です。
                見た鳥を「図鑑」で管理し、「イベント」で日々の観察を記録しましょう。
            </p>
            ${isElectron ? `
            <p class="text-sm text-gray-600 border-l-4 border-emerald-400 pl-3 py-1 bg-emerald-50">
                PC版では、大画面での多列表示や、高画質写真の管理が可能です。
            </p>
            ` : ''}

            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">📖 図鑑 (Pokedex) タブ</h3>
                <p class="text-sm text-gray-600">
                    このアプリの核となる、あなたの個人的な鳥類図鑑です。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>検索: 鳥の名前（ひらがな可）で図鑑全体を検索できます。</li>
                    <li>絞り込み: 「分類」「種類」「観察時期」「生息地」「サイズ」などで高度な絞り込み（フィルター）が可能です。</li>
                    <li>表示切替: 写真付きの「タイル表示」と、名前のみの「リスト表示」を切り替えられます。</li>
                    <li>並び替え: 「名前順」「サイズ順」「レア度順」で並び替えられます。</li>
                    <li>情報閲覧: 鳥をタップすると、分類、サイズ、生息地などの詳細情報を確認できます。</li>
                    <li>情報編集:
                        詳細画面の「情報を編集する」ボタンから、以下の情報をあなた専用にカスタマイズできます。
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>写真の追加・編集: お持ちの写真を登録できます（5MBまで）。登録時には、拡大・縮小や回転をして、見やすいようにトリミング（切り抜き）が可能です。</li>
                            <li>鳴き声（音声、10MBまで）の追加・削除</li>
                            <li>「区分（観察時期）」や「レア度」の変更</li>
                            <li>自由な「説明文」の追加</li>
                        </ul>
                    </li>
                    <li>ライフリスト:
                        「目視」「声」「写真」「動画」の4種類でライフリストを管理できます。
                        これは編集画面で手動でもON/OFFできますが、「イベント」タブからの自動更新が便利です。
                    </li>
                </ul>
            </section>

            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">📅 イベント (Events) タブ</h3>
                <p class="text-sm text-gray-600">
                    日々の探鳥会や観察記録を「イベント」として時系列で保存できます。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>イベント作成: 「新規イベント作成」から、日付、場所、天気、同行者などの基本情報を記録できます。</li>
                    <li>観察記録:
                        作成したイベントの詳細画面で、「観察した鳥」（名前、数、確認方法）を無制限に追加できます。
                    </li>
                    <li>図鑑との連携 (重要):
                        イベントに鳥を登録すると、図鑑アプリが以下の処理を自動で行います。
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>図鑑側の「最新の観察日」「最新の観察場所」をこのイベントの情報で更新します。</li>
                            <li>「設定」で自動更新がONの場合、確認方法（目視、声など）に応じて図鑑側のライフリストも自動でONにします。</li>
                        </ul>
                    </li>
                    <li>イベント検索: 「観察した鳥」の名前や「確認方法」で、過去のイベントを検索できます。</li>
                    <li>イベントメモ: イベントごとに自由にメモ（その日の感想など）を残せます。</li>
                </ul>
            </section>
            
            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">⚙️ 設定 (Settings) タブ</h3>
                <p class="text-sm text-gray-600">
                    アプリの各種設定、データの管理、そして「バーダーカード」機能が含まれます。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>バーダーカード:
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>あなたの名前と写真、ライフリストの集計結果が載った「名刺」を作成できます。</li>
                            <li>「カードを送る」で '.json' ファイルを生成し、SNSやLINE等で他のユーザーと交換できます。</li>
                            <li>「カードを読み込む」で、もらった '.json' ファイルをインポートし、「受信箱」に保存できます。</li>
                            <li>重要: LINE等でファイルを受け取った際は、タップして開かずに「端末に保存」してから、このアプリで読み込んでください。</li>
                        </ul>
                    </li>
                    <li>ライフリスト設定:
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>イベント登録時にライフリストを自動更新するかどうかを選べます（デフォルトはON）。</li>
                            <li>「イベント履歴からライフリストを追加」を押すと、過去の全イベントをスキャンし、図鑑のライフリストを強制的に更新します。</li>
                        </ul>
                    </li>
                    <li>背景設定: アプリの背景色や、背景画像（と透明度）を自由に変更できます。</li>
                </ul>
            </section>
        </div>
    `;

    // --- 2. データ保存に関する注意書き (条件分岐) ---
    let dataPrecautionsContent = '';

    if (isPwa) {
        // PWA (ブラウザ) 用
        dataPrecautionsContent = `
            <section class="space-y-3">
                <h3 class="text-lg font-semibold text-red-800">1. データは「ブラウザ」に保存されています</h3>
                <p class="text-sm text-red-700">
                    このアプリはサーバーと通信していません。データは今お使いのブラウザ（ChromeやSafariなど）の中に保存されています。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-red-700 pl-2">
                    <li>ブラウザの「閲覧履歴データの削除（キャッシュ削除）」を行うとデータが消えます。</li>
                    <li>7日以上アクセスしないとブラウザが自動削除する場合もあります（iOSなど）。</li>
                    <li>対策: 定期的に「データのエクスポート」でバックアップファイルを保存してください。</li>
                </ul>
            </section>
        `;
    } else if (isNativeApp) {
        // アプリ (Native) 用
        dataPrecautionsContent = `
            <section class="space-y-3">
                <h3 class="text-lg font-semibold text-red-800">1. データは「アプリ内」に保存されています</h3>
                <p class="text-sm text-red-700">
                    このアプリはオフラインで動作し、データは端末内のアプリ専用領域に保存されています。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-red-700 pl-2">
                    <li>アプリ自体を「アンインストール（削除）」すると、中のデータもすべて消えます。</li>
                    <li>機種変更をする際は、必ず「データのエクスポート」を行ってください。</li>
                </ul>
            </section>
        `;
    } else {
        // PC (Electron) 用
        dataPrecautionsContent = `
            <section class="space-y-3">
                <h3 class="text-lg font-semibold text-red-800">1. データは「PC内」に保存されています</h3>
                <p class="text-sm text-red-700">
                    データはPC内のアプリケーション領域に保存されています。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-red-700 pl-2">
                    <li>アプリをアンインストールするとデータも消去されます。</li>
                    <li>大切な記録は定期的に「データのエクスポート」でバックアップしてください。</li>
                </ul>
            </section>
        `;
    }

    // 共通部分（連携の話など）
    dataPrecautionsContent += `
        <section class="space-y-3">
            <h3 class="text-lg font-semibold pt-4 border-t border-red-200 text-blue-800">2. PCとスマホの使い分け</h3>
            <p class="text-sm text-blue-700">
                このアプリは、PC版とスマホ版でデータを連携（インポート/エクスポート）して使うと便利です。
            </p>
            <div class="bg-white p-3 rounded border border-blue-200 mt-2 text-sm text-gray-700 space-y-2">
                <p>PCを母艦として使う:<br>
                PC版では写真を「原寸（4K画質）」で保存できます。大画面での編集や管理に最適です。</p>
                <hr class="border-blue-100">
                <p>スマホをフィールド用として使う:<br>
                観察記録（イベント）の入力に最適です。スマホ版では容量節約のため、写真は自動的に「軽量サイズ」で保存されます。</p>
                <hr class="border-blue-100">
                <p>データの連携（同期）:<br>
                PCからスマホへ送る際、画像は自動的に圧縮されるのでスムーズに持ち出せます。<br>
                逆にスマホからPCへ送る際、イベント履歴は統合（マージ）されます。図鑑の写真については、PC側にすでに写真がある場合、PCの高画質データが優先して残ります（スマホ側の画像で上書きされません）。</p>
            </div>
        </section>
    `;


    const dataPrecautionsHtml = `
        <div class="bg-red-50 rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-semibold mb-4 text-red-700">⚠️ 使用上の注意！</h2>
            ${dataPrecautionsContent}
        </div>
    `;

    // --- 3. 観察時の注意 (野鳥観察の基本) ---
    const precautionsHtml = `
        <div class="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-semibold mb-4">野鳥観察の基本</h2>
            <p class="text-sm text-gray-600">
                野鳥と自然環境、そして周囲の人々への配慮が、素晴らしい観察体験の基本です。
            </p>

            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">1. 野鳥への配慮</h3>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>距離を保つ: 鳥が警戒したり、逃げたりしないよう、十分な距離を保ちましょう。特に巣やヒナには絶対に近づかないでください。</li>
                <li>ストレスを与えない: しつこく追いかけ回したり、大声を出したりしないでください。</li>
                <li>餌を与えない: 人間の食べ物は鳥にとって有害であり、生態系のバランスを崩す原因となります。</li>
                <li>録音音声の再生: 鳥の鳴き声（録音）を再生すると、鳥を混乱させたり、過度な警戒を強いたりする可能性があります。</li>
            </ul>

            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">2. 環境への配慮</h3>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>ルールを守る: 私有地や立ち入り禁止区域には絶対に入らないでください。</li>
                <li>ゴミは持ち帰る: 当たり前のことですが、ゴミはすべて持ち帰りましょう。</li>
                <li>自然を壊さない: 撮影のために枝を折ったり、草をむしったりする行為は絶対にやめましょう。</li>
            </ul>
            
            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">3. 他の人への配慮</h3>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>地域住民への配慮: 住宅地や早朝の観察では、話し声や音に注意しましょう。</li>
                <li>他の観察者への配慮: 場所の譲り合いや、情報共有の配慮を忘れずに。</li>
                <li>安全第一: 夢中になるあまり、足元や周囲への注意を怠らないようにしましょう。</li>
            </ul>
        </div>
    `;
    
    // --- 画面全体の描画 (アコーディオン化) ---
    app.innerHTML = `
        <div class="space-y-2 p-2">
            
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <button id="accordion-toggle-usage" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-gray-800">アプリの使い方</h2>
                    <svg id="accordion-arrow-usage" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-usage" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-gray-100 p-2">
                        ${usageHtml}
                    </div>
                </div>
            </div>

            <div class="bg-red-50 rounded-lg shadow overflow-hidden border border-red-200">
                <button id="accordion-toggle-data-precautions" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-red-700">⚠️ 使用上の注意！</h2>
                    <svg id="accordion-arrow-data-precautions" class="accordion-arrow h-5 w-5 text-red-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-data-precautions" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-red-100 p-2">
                       ${dataPrecautionsHtml}
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <button id="accordion-toggle-precautions" class="accordion-toggle w-full flex justify-between items-center p-4 text-left">
                    <h2 class="text-xl font-semibold text-gray-800">野鳥観察の基本</h2>
                    <svg id="accordion-arrow-precautions" class="accordion-arrow h-5 w-5 text-gray-500 transition-transform transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <div id="accordion-content-precautions" class="accordion-content" style="max-height: 0px;">
                    <div class="border-t border-gray-100 p-2">
                       ${precautionsHtml}
                    </div>
                </div>
            </div>

        </div>
    `;

    app.style.paddingBottom = '5rem';
    
    updateHeader('manual', '説明書'); // app.js の関数

    // --- リスナー設定 ---
    setTimeout(() => {
        try {
            // 汎用アコーディオン開閉関数
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
                    // 開く
                    content.style.maxHeight = (content.scrollHeight > 0 ? content.scrollHeight : 2000) + 'px';
                    arrow.classList.add('arrow-up');
                }
            };

            // アコーディオンのトグルボタンにリスナーを設定
            const usageToggle = document.getElementById('accordion-toggle-usage');
            if (usageToggle) {
                usageToggle.onclick = () => toggleAccordion('accordion-content-usage', 'accordion-arrow-usage');
            }
            
            const dataPrecautionsToggle = document.getElementById('accordion-toggle-data-precautions');
            if (dataPrecautionsToggle) {
                dataPrecautionsToggle.onclick = () => toggleAccordion('accordion-content-data-precautions', 'accordion-arrow-data-precautions');
            }

            const precautionsToggle = document.getElementById('accordion-toggle-precautions');
            if (precautionsToggle) {
                precautionsToggle.onclick = () => toggleAccordion('accordion-content-precautions', 'accordion-arrow-precautions');
            }

        } catch (error) {
            console.error("Error setting up manual page listeners:", error);
        }
    }, 0);
}