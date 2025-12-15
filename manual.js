// manual.js

// --- 説明書ページ ---
function showManualPage() { 
    // appState や app, updateHeader は app.js で定義されているグローバル変数・関数
    
    appState.currentPage = 'manual'; 
    appState.isEditing = false;
    
    // --- 1. アプリの使い方 ---
    const usageHtml = `
        <div class="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-semibold mb-4">ようこそ！</h2>
            <p class="text-sm text-gray-600">
                これは、あなたの野鳥観察を記録・管理するために作られた「鳥類図鑑PWA（プログレッシブ・ウェブアプリ）」です。
                見た鳥を「図鑑」で管理し、「イベント」で日々の観察を記録しましょう。
            </p>
            <p class="text-sm text-gray-600 border-l-4 border-emerald-400 pl-3 py-1 bg-emerald-50">
                <strong>PCでも便利に：</strong><br>
                PCの大画面で開くと、図鑑が多列表示になり一覧性が向上します。写真の整理や編集作業がより快適に行えます。
            </p>

            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">📖 図鑑 (Pokedex) タブ</h3>
                <p class="text-sm text-gray-600">
                    このアプリの核となる、あなたの個人的な鳥類図鑑です。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li><strong>検索:</strong> 鳥の名前（ひらがな可）で図鑑全体を検索できます。</li>
                    <li><strong>絞り込み:</strong> 「分類」「種類」「観察時期」「生息地」「サイズ」などで高度な絞り込み（フィルター）が可能です。</li>
                    <li><strong>表示切替:</strong> 写真付きの「タイル表示」と、名前のみの「リスト表示」を切り替えられます。</li>
                    <li><strong>並び替え:</strong> 「名前順」「サイズ順」「レア度順」で並び替えられます。</li>
                    <li><strong>情報閲覧:</strong> 鳥をタップすると、分類、サイズ、生息地などの詳細情報を確認できます。</li>
                    <li><strong>情報編集:</strong>
                        詳細画面の「情報を編集する」ボタンから、以下の情報をあなた専用にカスタマイズできます。
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li><strong>写真の追加・編集:</strong> お持ちの写真を登録できます（5MBまで）。登録時には、拡大・縮小や回転をして、見やすいように<strong>トリミング（切り抜き）</strong>が可能です。</li>
                            <li>鳴き声（音声、10MBまで）の追加・削除</li>
                            <li>「区分（観察時期）」や「レア度」の変更</li>
                            <li>自由な「説明文」の追加</li>
                        </ul>
                    </li>
                    <li><strong>ライフリスト:</strong>
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
                    <li><strong>イベント作成:</strong> 「新規イベント作成」から、日付、場所、天気、同行者などの基本情報を記録できます。</li>
                    <li><strong>観察記録:</strong>
                        作成したイベントの詳細画面で、「観察した鳥」（名前、数、確認方法）を無制限に追加できます。
                    </li>
                    <li><strong>図鑑との連携 (重要):</strong>
                        イベントに鳥を登録すると、図鑑アプリが以下の処理を自動で行います。
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>図鑑側の「最新の観察日」「最新の観察場所」をこのイベントの情報で更新します。</li>
                            <li>「設定」で自動更新がONの場合、確認方法（目視、声など）に応じて図鑑側のライフリストも自動でONにします。</li>
                        </ul>
                    </li>
                    <li><strong>イベント検索:</strong> 「観察した鳥」の名前や「確認方法」で、過去のイベントを検索できます。</li>
                    <li><strong>イベントメモ:</strong> イベントごとに自由にメモ（その日の感想など）を残せます。</li>
                </ul>
            </section>
            
            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">⚙️ 設定 (Settings) タブ</h3>
                <p class="text-sm text-gray-600">
                    アプリの各種設定、データの管理、そして「バーダーカード」機能が含まれます。
                </p>
                <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li><strong>バーダーカード:</strong>
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>あなたの名前と写真、ライフリストの集計結果が載った「名刺」を作成できます。</li>
                            <li>「カードを送る」で '.bcard' ファイルを生成し、他のユーザーと交換できます。</li>
                            <li>「カードを読み込む」で、もらった '.bcard' ファイルをインポートし、「受信箱」に保存できます。</li>
                        </ul>
                    </li>
                    <li><strong>ライフリスト設定:</strong>
                        <ul class="list-inside list-disc ml-4 mt-1 text-xs text-gray-600">
                            <li>イベント登録時にライフリストを自動更新するかどうかを選べます（デフォルトはON）。</li>
                            <li>「イベント履歴からライフリストを追加」を押すと、過去の全イベントをスキャンし、図鑑のライフリストを強制的に更新します。</li>
                        </ul>
                    </li>
                    <li><strong>背景設定:</strong> アプリの背景色や、背景画像（と透明度）を自由に変更できます。</li>
                </ul>
            </section>
        </div>
    `;

    // --- 2. ★★★ 新設: データに関する注意書き ★★★ ---
    const dataPrecautionsHtml = `
        <div class="bg-red-50 rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-semibold mb-4 text-red-700">⚠️ 使用上の注意！</h2>
            
            <section class="space-y-3">
                <h3 class="text-lg font-semibold text-red-800">1. データは「あなたのブラウザ」にのみ保存されます</h3>
                <p class="text-sm text-red-700">
                    このアプリはサーバーと通信していません。あなたの観察記録、写真、設定はすべて、今お使いのデバイス（スマホやPC）のブラウザ内に保存されています。
                </p>
                <p class="text-sm text-red-700">
                    機種変更をした場合や、以下の操作を行うと、データはすべて消え、復元できません。
                </p>
                
                <ul class="list-disc list-inside space-y-2 text-sm text-red-700 pl-2">
                    <li>ブラウザ（Chrome/Safari）の「閲覧履歴データの削除」で「キャッシュ」や「サイトデータ」を削除する。</li>
                    <li>ホーム画面の「BLNCR鳥図鑑」アイコンを「アンインストール」（または「Appを削除」）する。</li>
                    <li>ブラウザ（Chrome/Safari）自体をスマホから削除する。</li>
                    <li>スマホの「ストレージ クリーンアップ」機能でブラウザのデータを削除する。</li>
                </ul>
            </section>
            
            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-red-200 text-blue-800">2. 解決策：必ずバックアップを！</h3>
                <p class="text-sm text-blue-700">
                    データを守るため、定期的（例：月に一度）に「設定」タブ →「データ管理」にある「データのエクスポート」を実行してください。
                </p>
                <p class="text-sm text-blue-700">
                    'bird-pokedex-backup-xxxx.json' というファイルがダウンロードされます。これさえあれば、万が一データが消えても「データのインポート」から復元できます。
                </p>
            </section>
                
            <section class="space-y-3">
                <h3 class="text-lg font-semibold pt-4 border-t border-red-200 text-yellow-800">3. データのインポート（統合）について</h3>
                <p class="text-sm text-yellow-700">
                    「データのインポート」を実行すると、PCで編集したデータをスマホに取り込んだり、バックアップを復元したりできます。
                    <br>データは以下のルールで賢く統合（マージ）されます。
                </p>
                <div class="bg-white p-3 rounded border border-yellow-200 mt-2 text-sm text-gray-700 space-y-2">
                    <p><strong>🐦 図鑑データ（写真・説明など）</strong><br>
                    基本的にはファイルの内容で上書きされますが、<br>
                    <span class="text-red-600 font-bold">ファイル側の項目が「空」で、今のアプリに「データがある」場合、今のデータが維持されます。</span><br>
                    （例：PCで編集していない鳥の写真は、スマホで撮影したものがそのまま残ります）
                    </p>
                    <hr class="border-yellow-100">
                    <p><strong>📅 イベント履歴</strong><br>
                    今のアプリにある記録はそのまま残り、ファイルに含まれる新しい記録が追加されます。<br>
                    （スマホで記録したイベントが消えることはありません）
                    </p>
                </div>
            </section>
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
                <li><strong>距離を保つ:</strong> 鳥が警戒したり、逃げたりしないよう、十分な距離を保ちましょう。特に巣やヒナには絶対に近づかないでください。巣立ち雛は親から餌をもらっている時期なので、見つけてもそっとしておきましょう。持ち去ると誘拐にあたり、法にも違反します。もし野鳥が野生生物に襲われていても、介入してはいけません（外来生物による被害を除く）。</li>
                <li><strong>ストレスを与えない:</strong> しつこく追いかけ回したり、大声を出したりしないでください。</li>
                <li><strong>餌を与えない:</strong> 人間の食べ物は鳥にとって有害であり、生態系のバランスを崩す原因となります。人や鳥の感染症が広がる、行動の変化により生存が難しくなる（本来の食物を得る事ができなくなる）、農作物の食害や人への攻撃行動を増加させ駆除される恐れがある、人への警戒心が薄れ密猟や事故を助長する、等の影響を想像できるようになりましょう。</li>
                <li><strong>録音音声の再生:</strong> 鳥の鳴き声（録音）を再生すると、鳥を混乱させたり、過度な警戒や縄張り防衛行動（体力の消耗）を強いたりする可能性があります。特に繁殖期は控えましょう。</li>
            </ul>

            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">2. 環境への配慮</h3>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li><strong>ルールを守る:</strong> 私有地や立ち入り禁止区域には絶対に入らないでください。農地（あぜ道など）を踏み荒らさないよう注意しましょう。</li>
                <li><strong>ゴミは持ち帰る:</strong> 当たり前のことですが、ゴミはすべて持ち帰りましょう。</li>
                <li><strong>自然を壊さない:</strong> 撮影のために枝を折ったり、草をむしったり、構造物を設置する行為は絶対にやめましょう。</li>
            </ul>
            
            <h3 class="text-lg font-semibold pt-4 border-t border-gray-100">3. 他の人への配慮</h3>
            <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li><strong>地域住民への配慮:</strong> 住宅地や早朝の観察では、話し声や車のドアの音などに注意し、静かに行動しましょう。</li>
                <li><strong>他の観察者への配慮:</strong> 三脚を立てる場所や移動の際は、お互いに譲り合いましょう。珍しい鳥の情報を共有する際は、鳥に過度なプレッシャーがかからないよう情報公開の範囲に配慮しましょう。</li>
                <li><strong>安全第一:</strong> 夢中になるあまり、足元や周囲（車、自転車など）への注意を怠らないようにしましょう。</li>
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
                    // 開く (scrollHeight が 0 の場合のフォールバック)
                    // 説明書は長いので、フォールバックを 2000px に増やしておく
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