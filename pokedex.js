// --- 画面描画: 図鑑リスト ---
function showListPage() { 
    appState.currentPage = 'list'; appState.isEditing = false;

    console.log(`showListPage called. birdDatabase length: ${birdDatabase ? birdDatabase.length : 'null'}, loadError: ${localStorage.getItem('birdDatabaseLoadError')}`); 
    
    if (localStorage.getItem('birdDatabaseLoadError')) {
        app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">データ読み込みエラー</strong><span class="block sm:inline">図鑑データの読み込みに失敗しました。データが破損している可能性があります。</span><p class="mt-2">「設定」タブから「全データ消去」を実行し、再度「今すぐ同期する」ボタンを押してください。</p></div>`;
        updateHeader('list', 'エラー'); 
        return;
    } else if (!birdDatabase || birdDatabase.length === 0) {
         if (typeof GITHUB_CSV_URL !== 'undefined' && GITHUB_CSV_URL.includes('[YOUR_USERNAME]')) {
            app.innerHTML = `<div class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">初期設定が必要です</strong><span class="block sm:inline">アプリのURL設定が完了していません。「設定」タブでURLを確認してください。</span></div>`;
        } else {
             app.innerHTML = `<div class="bg-white rounded-lg shadow p-6 text-center"><h2 class="text-xl font-semibold mb-4">ようこそ</h2><p class="text-gray-600">図鑑データが空です。「設定」タブから「今すぐ同期する」ボタンを押してください。</p></div>`;
        }
        updateHeader('list'); 
        return;
    }

    app.innerHTML = `<div id="pokedex-list-container" class="p-4"><div id="pokedex-list"></div><div id="pagination-controls" class="mt-6 flex justify-between items-center"></div></div>`;

    updateHeader('list'); 
    
    setTimeout(() => {
        try { 
            applyFiltersAndRenderList();
        } catch(e) {
            console.error("Error rendering list:", e);
            app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">表示エラー</strong><span class="block sm:inline">リストの表示中にエラーが発生しました。</span></div>`;
        }
        
        if (searchToggleButton) searchToggleButton.onclick = () => togglePopup('search');
        else console.error("Search toggle button not found");
        if (filterToggleButton) filterToggleButton.onclick = () => togglePopup('filter');
        else console.error("Filter toggle button not found");
        if (viewToggleButton) viewToggleButton.onclick = () => togglePopup('view');
        else console.error("View toggle button not found");
    }, 0);
}

// --- 検索ポップアップ ---
function renderSearchPopup() { 
    const { filterText } = appState.listControls; 
    const filterStatus = getFilterStatus(); 
    
    searchPopup.innerHTML = `
        <div class="relative w-full">
            <label for="searchBox" class="sr-only">鳥を検索</label>
            <input type="search" id="searchBox" placeholder="鳥を検索..." value="${escapeHTML(filterText)}" class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" autocomplete="off">
            <button id="clear-search-btn" class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-red-600 ${filterText ? '' : 'hidden'}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
        <p id="search-status-text" class="text-xs text-green-600 mt-1">${filterStatus.isTextFiltered ? '検索中...' : ''}</p>
        <div id="search-suggestions" class="mt-2 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-lg max-h-48 overflow-y-auto"></div>`;
    
    setTimeout(() => {
        const searchBox = searchPopup.querySelector('#searchBox');
        const clearBtn = searchPopup.querySelector('#clear-search-btn');
        
        if (searchBox && clearBtn) {
            searchBox.addEventListener('input', (e) => {
                const newText = e.target.value;
                appState.listControls.filterText = newText; 
                appState.listControls.currentPage = 1; 
                
                applyFiltersAndRenderList(); 
                renderSearchSuggestions(getSearchSuggestions(newText)); 
                saveListControlsState();
                
                clearBtn.classList.toggle('hidden', !newText); 
                
                const currentStatus = getFilterStatus(); 
                filterActiveDot.classList.toggle('hidden', !currentStatus.isFiltered);
                const statusElem = searchPopup.querySelector('#search-status-text'); 
                if(statusElem) statusElem.textContent = currentStatus.isTextFiltered ? '検索中...' : '';
            });
            
            clearBtn.addEventListener('click', () => {
                appState.listControls.filterText = '';
                appState.listControls.currentPage = 1;
                searchBox.value = ''; 
                
                applyFiltersAndRenderList();
                renderSearchSuggestions([]); 
                saveListControlsState();
                
                clearBtn.classList.add('hidden'); 
                
                updateHeader('list'); 
                
                const statusElem = searchPopup.querySelector('#search-status-text'); 
                if(statusElem) statusElem.textContent = '';
                
                searchBox.focus(); 
            });

            if (filterText) renderSearchSuggestions(getSearchSuggestions(filterText));
            searchBox.focus();
        } else {
            console.error("Search box or clear button not found in popup.");
        }
    }, 0);
}

function renderSearchSuggestions(suggestions) { 
    const box = searchPopup.querySelector('#search-suggestions'); if (!box) return; 
    if (suggestions.length === 0) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = suggestions.map(n => `<div class="p-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 search-suggestion-item" data-name="${escapeHTML(n)}">${escapeHTML(n)}</div>`).join(''); 
    
    setTimeout(() => {
        box.querySelectorAll('.search-suggestion-item').forEach(item => item.addEventListener('click', () => selectSearchSuggestion(item.dataset.name)));
    }, 0);
} 

function selectSearchSuggestion(name) { 
    const box = searchPopup.querySelector('#searchBox'); if (box) box.value = name;
    appState.listControls.filterText = name; appState.listControls.currentPage = 1; 
    applyFiltersAndRenderList(); renderSearchSuggestions([]); saveListControlsState();
    const currentStatus = getFilterStatus(); filterActiveDot.classList.toggle('hidden', !currentStatus.isFiltered);
    const statusElem = searchPopup.querySelector('#search-status-text'); if(statusElem) statusElem.textContent = currentStatus.isTextFiltered ? '検索中...' : '';
} 

// --- ポップアップ描画 (図鑑: 絞り込み) ---
function renderFilterPopup() { 
    const { filters, openFilterSection } = appState.listControls; const filterStatus = getFilterStatus(); 
    
    const filterSections = [
        { id: 'classification', title: '分類 (目)' }, { id: 'type', title: '種類' }, 
        { id: 'season', title: '観察時期' }, 
        { id: 'habitat', title: '生息地' }, { id: 'size', title: '体サイズ' }, 
        { id: 'edited', title: '図鑑の編集履歴' } 
    ];
    
    const createSelectButtons = (id) => `<div class="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2"><button class="select-all-btn text-xs font-medium text-emerald-600 hover:text-emerald-800" data-section="${id}">全選択</button><button class="select-none-btn text-xs font-medium text-gray-500 hover:text-gray-700" data-section="${id}">全解除</button></div>`;
    
    filterPopup.innerHTML = filterSections.map(section => {
        const isOpen = openFilterSection === section.id; let isFiltered = false;
        switch(section.id) {
            case 'classification': isFiltered = filterStatus.isClassificationFiltered; break; case 'type': isFiltered = filterStatus.isTypeFiltered; break;
            case 'season': isFiltered = filterStatus.isSeasonFiltered; break; case 'habitat': isFiltered = filterStatus.isHabitatFiltered; break;
            case 'size': isFiltered = filterStatus.isSizeFiltered; break; 
            case 'edited': isFiltered = filterStatus.isEditedFiltered || filterStatus.isLiferStatusFiltered; break; 
        }
        const filteredClass = isFiltered ? 'filtered' : ''; let contentHtml = '';
        switch (section.id) {
            case 'classification': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + allOrders.map(o => `<label for="filter_order_${o}" class="flex items-center space-x-2"><input type="checkbox" id="filter_order_${o}" name="classification_order" value="${o}" ${filters.classification.orders.includes(o)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${o}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'type': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + filterableTypes.map(t => `<label for="filter_type_${t}" class="flex items-center space-x-2"><input type="checkbox" id="filter_type_${t}" name="type" value="${t}" ${filters.type.includes(t)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${t}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'season': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + filterableSeasons.map(s => `<label for="filter_season_${s}" class="flex items-center space-x-2"><input type="checkbox" id="filter_season_${s}" name="season" value="${s}" ${filters.season.includes(s)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${s}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'habitat': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + habitatKeys.map(h => `<label for="filter_habitat_${h.key}" class="flex items-center space-x-2"><input type="checkbox" id="filter_habitat_${h.key}" name="habitat" value="${h.key}" ${filters.habitat.includes(h.key)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${h.label}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'size': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + Object.entries(sizeRanges).map(([k,r]) => `<label for="filter_size_${k}" class="flex items-center space-x-2"><input type="checkbox" id="filter_size_${k}" name="size" value="${k}" ${filters.size.includes(k)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${r.label}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'edited': 
                const liferFilters = [
                    { key: 'seen', label: '目視' },
                    { key: 'heard', label: '声' },
                    { key: 'photo', label: '写真' },
                    { key: 'video', label: '動画' }
                ];
                contentHtml = `
                <div class="p-4 space-y-4">
                    <div>
                        <h4 class="text-sm font-semibold text-gray-500 mb-2">ライフリストの有無</h4>
                        <div class="grid grid-cols-3 gap-x-3 gap-y-3">
                            ${liferFilters.map(f => `
                                <label for="filter_lifer_${f.key}" class="block text-xs font-medium text-gray-700">${f.label}</label>
                                <select id="filter_lifer_${f.key}" name="lifer_${f.key}" class="col-span-2 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-1 text-sm focus:ring-emerald-500 focus:border-emerald-500">
                                    <option value="any" ${filters.lifer[f.key] === 'any' ? 'selected' : ''}>すべて</option>
                                    <option value="yes" ${filters.lifer[f.key] === 'yes' ? 'selected' : ''}>あり</option>
                                    <option value="no" ${filters.lifer[f.key] === 'no' ? 'selected' : ''}>なし</option>
                                </select>
                            `).join('')}
                        </div>
                    </div>
                    <div class="pt-4 border-t border-gray-200">
                        <h4 class="text-sm font-semibold text-gray-500 mb-2">編集あり/なし</h4>
                        <div class="space-y-2">
                            <label for="filter_edited_all" class="flex items-center space-x-2"><input type="radio" id="filter_edited_all" name="edited" value="all" ${filters.edited === 'all' ? 'checked' : ''} class="form-radio text-emerald-600"><span>すべて</span></label>
                            <label for="filter_edited_yes" class="flex items-center space-x-2"><input type="radio" id="filter_edited_yes" name="edited" value="yes" ${filters.edited === 'yes' ? 'checked' : ''} class="form-radio text-emerald-600"><span>編集あり (写真/音声/説明文)</span></label>
                            <label for="filter_edited_no" class="flex items-center space-x-2"><input type="radio" id="filter_edited_no" name="edited" value="no" ${filters.edited === 'no' ? 'checked' : ''} class="form-radio text-emerald-600"><span>編集なし</span></label>
                        </div>
                    </div>
                </div>`; 
                break;
        }
        return `<div class="border-b border-gray-200"><button class="accordion-header w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 ${filteredClass}" data-section="${section.id}"><span>${section.title}</span><svg class="h-5 w-5 ${isOpen?'arrow-up':'arrow-down'}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></button><div class="accordion-content bg-white" style="${isOpen?'max-height: 500px;':''}">${contentHtml}</div></div>`;
    }).join('');

    setTimeout(() => {
        filterPopup.querySelectorAll('.accordion-header').forEach(btn => btn.addEventListener('click', (event) => { 
            event.stopPropagation(); 
            const id = btn.dataset.section; appState.listControls.openFilterSection = (appState.listControls.openFilterSection === id) ? null : id; renderFilterPopup(); 
        }));
      
        const updateCheckboxFilter = (name, values, isOrder = false) => { 
            if (isOrder) appState.listControls.filters.classification.orders = values; else appState.listControls.filters[name] = values;
            appState.listControls.currentPage = 1; applyFiltersAndRenderList(); saveListControlsState(); updateHeader('list');
        };
        
        ['type', 'season', 'habitat', 'size', 'classification_order'].forEach(name => { 
            filterPopup.querySelectorAll(`input[name="${name}"]`).forEach(cb => cb.addEventListener('change', () => {
                const isOrder = name === 'classification_order'; const actualName = isOrder ? 'classification.orders' : name; 
                const values = Array.from(filterPopup.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);
                updateCheckboxFilter(actualName.split('.')[0], values, isOrder); 
            }));
        });
        
        ['edited'].forEach(name => { 
            filterPopup.querySelectorAll(`input[name="${name}"]`).forEach(radio => radio.addEventListener('change', (e) => {
                appState.listControls.filters[name] = e.target.value; appState.listControls.currentPage = 1;
                applyFiltersAndRenderList(); saveListControlsState(); updateHeader('list');
            }));
        });
        
        ['lifer_seen', 'lifer_heard', 'lifer_photo', 'lifer_video'].forEach(name => {
            const select = filterPopup.querySelector(`select[name="${name}"]`);
            if (select) {
                select.addEventListener('change', (e) => {
                    const key = name.split('_')[1]; 
                    appState.listControls.filters.lifer[key] = e.target.value;
                    appState.listControls.currentPage = 1;
                    applyFiltersAndRenderList(); saveListControlsState(); updateHeader('list');
                });
            }
        });
        
        const handleSelectAll = (id, selectAll) => {
            let name, allValues, isOrder = false; 
            if (id === 'type') { name = 'type'; allValues = [...filterableTypes]; }
            else if (id === 'season') { name = 'season'; allValues = [...filterableSeasons]; }
            else if (id === 'habitat') { name = 'habitat'; allValues = habitatKeys.map(h => h.key); }
            else if (id === 'size') { name = 'size'; allValues = Object.keys(sizeRanges); }
            else if (id === 'classification') { name = 'classification_order'; allValues = [...allOrders]; isOrder = true; } 
            else return;
            const values = selectAll ? allValues : [];
            filterPopup.querySelectorAll(`input[name="${name}"]`).forEach(cb => cb.checked = selectAll);
            updateCheckboxFilter(isOrder ? 'classification' : name, values, isOrder);
        };
        
        filterPopup.querySelectorAll('.select-all-btn').forEach(btn => btn.addEventListener('click', (e) => handleSelectAll(e.target.dataset.section, true)));
        filterPopup.querySelectorAll('.select-none-btn').forEach(btn => btn.addEventListener('click', (e) => handleSelectAll(e.target.dataset.section, false)));
    }, 0);
} 

// --- ポップアップ描画 (図鑑: 表示切替) ---
function renderViewPopup() { 
    const { sort, viewMode } = appState.listControls;
    const sortOptions = [
        { value: 'name_asc', label: '名前 (昇順)' }, { value: 'name_desc', label: '名前 (降順)' },
        { value: 'size_asc', label: 'サイズ (小さい順)' }, { value: 'size_desc', label: 'サイズ (大きい順)' },
        { value: 'rarity_asc', label: 'レア度 (昇順)' }, { value: 'rarity_desc', label: 'レア度 (降順)' }
    ];
    const viewOptions = [ { value: 'tile', label: 'タイル表示 (写真あり)' }, { value: 'list', label: 'リスト表示 (名前のみ)' } ];
    
    viewPopup.innerHTML = `<div class="p-4 space-y-4"><div><h3 class="text-sm font-semibold text-gray-500 mb-2">並び替え</h3><div class="space-y-2">${sortOptions.map(o => `<label for="sort_${o.value}" class="flex items-center space-x-2"><input type="radio" id="sort_${o.value}" name="sort" value="${o.value}" ${sort===o.value?'checked':''} class="form-radio text-emerald-600"><span>${o.label}</span></label>`).join('')}</div></div><div class="pt-4 border-t border-gray-200"><h3 class="text-sm font-semibold text-gray-500 mb-2">表示形式</h3><div class="space-y-2">${viewOptions.map(o => `<label for="view_${o.value}" class="flex items-center space-x-2"><input type="radio" id="view_${o.value}" name="viewMode" value="${o.value}" ${viewMode===o.value?'checked':''} class="form-radio text-emerald-600"><span>${o.label}</span></label>`).join('')}</div></div></div>`;
    
    setTimeout(() => {
        viewPopup.querySelectorAll('input[name="sort"]').forEach(r => r.addEventListener('change', (e) => { appState.listControls.sort = e.target.value; appState.listControls.currentPage = 1; applyFiltersAndRenderList(); saveListControlsState(); }));
        viewPopup.querySelectorAll('input[name="viewMode"]').forEach(r => r.addEventListener('change', (e) => { appState.listControls.viewMode = e.target.value; appState.listControls.currentPage = 1; applyFiltersAndRenderList(); saveListControlsState(); }));
    }, 0);
}

// --- 図鑑リスト描画 ---
function applyFiltersAndRenderList() {
    const listContainer = document.getElementById('pokedex-list-container'); if (!listContainer) return; 
    const listElement = listContainer.querySelector('#pokedex-list');
    if (!listElement) return; 

    // ★ 追加: 画面幅に応じて表示件数を自動調整
    const width = window.innerWidth;
    if (width >= 2000) { // 超ワイド (2000px以上)
        appState.listControls.itemsPerPage = 120;
    } else if (width >= 1536) { // 2xl (1536px以上)
        appState.listControls.itemsPerPage = 100;
    } else if (width >= 1280) { // xl (1280px以上)
        appState.listControls.itemsPerPage = 80;
    } else if (width >= 1024) { // lg (1024px以上)
        appState.listControls.itemsPerPage = 60;
    } else if (width >= 768) { // md (768px以上)
        appState.listControls.itemsPerPage = 40;
    } else { // スマホ (デフォルト)
        appState.listControls.itemsPerPage = 30;
    }
    
    const { sort, filters, filterText, viewMode, itemsPerPage } = appState.listControls;
    const hiraganaFilter = toHiragana(filterText);

    processedBirdList = birdDatabase.filter(bird => {
        const matchesSearch = toHiragana(bird.name || '').includes(hiraganaFilter);
        const matchesSeason = filters.season.length === 0 ? false : filters.season.length === filterableSeasons.length ? true : filters.season.includes(bird.season);
        const matchesType = filters.type.length === 0 ? false : filters.type.length === filterableTypes.length ? true : filters.type.includes(bird.type);
        let matchesOrder = true;
        if (filters.classification.orders.length === 0) {
            matchesOrder = false;
        } else if (filters.classification.orders.length !== allOrders.length) { 
             if (!bird.classification) {
                matchesOrder = false; 
            } else {
                const match = bird.classification.match(/^(.+?目)/);
                matchesOrder = match && filters.classification.orders.includes(match[1]);
            }
        } 
        const matchesFamily = true; 
        const matchesClassification = matchesOrder && matchesFamily;
        const matchesHabitat = filters.habitat.length === 0 ? false : filters.habitat.length === habitatKeys.length ? true : filters.habitat.some(h_key => bird[h_key] === '1'); 
        const birdSizeRange = getSizeRange(bird.size);
        let matchesSize = true; 
        if (birdSizeRange !== null) { 
            matchesSize = filters.size.length === 0 ? false : 
                          filters.size.length === Object.keys(sizeRanges).length ? true : 
                          filters.size.includes(birdSizeRange); 
        }
        
        const isEdited = (typeof bird.photo_url === 'string' && bird.photo_url.startsWith('data:image')) ||
                         (typeof bird.voice_url === 'string' && bird.voice_url.startsWith('data:audio')) ||
                         (bird.description && bird.description.length > 0);
        const matchesEdited = filters.edited === 'all' ||
                              (filters.edited === 'yes' && isEdited) ||
                              (filters.edited === 'no' && !isEdited);
        
        const matchesLiferSeen = filters.lifer.seen === 'any' ||
                                 (filters.lifer.seen === 'yes' && bird.lifer_seen) ||
                                 (filters.lifer.seen === 'no' && !bird.lifer_seen);
        const matchesLiferHeard = filters.lifer.heard === 'any' ||
                                  (filters.lifer.heard === 'yes' && bird.lifer_heard) ||
                                  (filters.lifer.heard === 'no' && !bird.lifer_heard);
        const matchesLiferPhoto = filters.lifer.photo === 'any' ||
                                  (filters.lifer.photo === 'yes' && bird.lifer_photo) ||
                                  (filters.lifer.photo === 'no' && !bird.lifer_photo);
        const matchesLiferVideo = filters.lifer.video === 'any' ||
                                  (filters.lifer.video === 'yes' && bird.lifer_video) ||
                                  (filters.lifer.video === 'no' && !bird.lifer_video);
        
        return matchesSearch && matchesSeason && matchesType && matchesClassification && 
               matchesHabitat && matchesSize && matchesEdited && 
               matchesLiferSeen && matchesLiferHeard && matchesLiferPhoto && matchesLiferVideo; 
    });
    
    const jaCollator = new Intl.Collator('ja'); 
    const getSizeNum = (sizeCm) => { const sizeString = String(sizeCm || ''); if (sizeString.includes('-')) { const numbers = sizeString.match(/(\d+(\.\d+)?)/g); if (numbers && numbers.length >= 2) { const num1 = parseFloat(numbers[0]); const num2 = parseFloat(numbers[1]); if (!isNaN(num1) && !isNaN(num2)) { return (num1 + num2) / 2; } } } const match = sizeString.match(/(\d+(\.\d+)?)/); const size = match ? parseFloat(match[1]) : NaN; return isNaN(size) ? Infinity : size; };
    const getRarityNum = (rarity) => { const r = parseInt(rarity, 10); return isNaN(r) ? 99 : r; };
    processedBirdList.sort((a, b) => {
        switch (sort) {
            case 'name_asc': return jaCollator.compare(a.name, b.name);
            case 'name_desc': return jaCollator.compare(b.name, a.name);
            case 'size_asc': { const sizeA = getSizeNum(a.size), sizeB = getSizeNum(b.size); if (sizeA === Infinity && sizeB === Infinity) return 0; if (sizeA === Infinity) return 1; if (sizeB === Infinity) return -1; return sizeA - sizeB; }
            case 'size_desc': { const sizeA = getSizeNum(a.size), sizeB = getSizeNum(b.size); if (sizeA === Infinity && sizeB === Infinity) return 0; if (sizeA === Infinity) return 1; if (sizeB === Infinity) return -1; return sizeB - sizeA; }
            case 'rarity_asc': { const rarityA = getRarityNum(a.rarity), rarityB = getRarityNum(b.rarity); if (rarityA === 99 && rarityB === 99) return 0; if (rarityA === 99) return 1; if (rarityB === 99) return -1; return rarityA - rarityB; }
            case 'rarity_desc': { const rarityA = getRarityNum(a.rarity), rarityB = getRarityNum(b.rarity); if (rarityA === 99 && rarityB === 99) return 0; if (rarityA === 99) return 1; if (rarityB === 99) return -1; return rarityB - rarityA; }
            default: return 0;
        }
    });
    
    const totalItems = processedBirdList.length; const totalPages = Math.ceil(totalItems / itemsPerPage);
    let currentPage = appState.listControls.currentPage || 1;
    if (currentPage < 1) currentPage = 1; else if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    appState.listControls.currentPage = currentPage; 
    
    const startIndex = (currentPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage;
    const paginatedList = processedBirdList.slice(startIndex, endIndex);

    if (paginatedList.length === 0) { listElement.className = ''; listElement.innerHTML = `<p class="text-gray-500 text-center col-span-2">鳥が見つかりません。</p>`; } 
    else {
        if (viewMode === 'tile') {
            // ★ 修正: PCで最大12列まで拡張 (xl:grid-cols-8 2xl:grid-cols-10 min-[2000px]:grid-cols-12)
            listElement.className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 min-[2000px]:grid-cols-12 gap-4';
            listElement.innerHTML = paginatedList.map(bird => {
                const isLifer = bird.lifer_seen || bird.lifer_heard || bird.lifer_photo || bird.lifer_video;
                const liferMedal = isLifer ? '<span class="lifer-medal" title="ライフリスト登録済み"></span>' : '';
            
                const placeholderUrl = './favicon3.png';
                const imageUrl = bird.photo_url || placeholderUrl;
                const opacityClass = bird.photo_url ? '' : 'opacity-30'; 

                const seasonTag = getSeasonTag(bird.season);
                const habitatLabels = getHabitatLabels(bird); 
                const habitatText = habitatLabels.join(', '); 
                const habitatHtml = habitatText ? `<span class="text-xs text-gray-500 leading-tight">${escapeHTML(habitatText)}</span>` : ''; 
                
                return `
                    <div class="bg-white rounded-lg shadow overflow-hidden cursor-pointer" onclick="showDetailPage('${bird.id}')">
                        <img src="${imageUrl}" alt="${escapeHTML(bird.name)}" 
                             onerror="this.onerror=null; this.src='${placeholderUrl}';"
                             class="w-full h-32 object-cover ${opacityClass}">
                        <div class="p-3">
                            <h3 class="font-semibold text-gray-800 mb-1 truncate">${liferMedal}${escapeHTML(bird.name)}</h3>
                            <div class="flex flex-col items-start space-y-1"> 
                                ${seasonTag}
                                ${habitatHtml}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            listElement.className = 'bg-white rounded-lg shadow overflow-hidden divide-y divide-gray-200';
            listElement.innerHTML = paginatedList.map(bird => {
                const isLifer = bird.lifer_seen || bird.lifer_heard || bird.lifer_photo || bird.lifer_video;
                const liferMedal = isLifer ? '<span class="lifer-medal" title="ライフリスト登録済み"></span>' : '';

                return `
                    <div class="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center" onclick="showDetailPage('${bird.id}')">
                        <h3 class="font-semibold text-gray-800">${liferMedal}${escapeHTML(bird.name)}</h3>
                        <span class="text-xs text-gray-400">&gt;</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    renderPaginationControls(listContainer, totalItems, totalPages);
}

// --- ページネーション描画 ---
function renderPaginationControls(listContainer, totalItems, totalPages) { 
    const controlsElement = listContainer.querySelector('#pagination-controls');
    if (!controlsElement) {
        console.error("Pagination controls element not found.");
        return;
    }
    const currentPg = appState.listControls.currentPage; 

    if (totalPages <= 1) {
        controlsElement.innerHTML = '';
        return;
    }

    const pageInfo = `
        <span class="text-sm text-gray-600">
            ${totalItems} 件中 ${Math.min( (currentPg - 1) * appState.listControls.itemsPerPage + 1, totalItems )}
            - ${Math.min( currentPg * appState.listControls.itemsPerPage, totalItems )} 件
        </span>`;
    
    const prevButton = `
        <button id="prev-page" class="pagination-button px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                ${currentPg === 1 ? 'disabled' : ''}>
            前へ
        </button>`;
    
    const nextButton = `
        <button id="next-page" class="pagination-button px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                ${currentPg === totalPages ? 'disabled' : ''}>
            次へ
        </button>`;

    controlsElement.innerHTML = `${prevButton} ${pageInfo} ${nextButton}`;
    
    setTimeout(() => {
        const prevBtn = controlsElement.querySelector('#prev-page');
        const nextBtn = controlsElement.querySelector('#next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (appState.listControls.currentPage > 1) {
                    appState.listControls.currentPage--;
                    applyFiltersAndRenderList();
                    window.scrollTo(0, 0); 
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (appState.listControls.currentPage < totalPages) {
                    appState.listControls.currentPage++;
                    applyFiltersAndRenderList();
                    window.scrollTo(0, 0); 
                }
            });
        }
    }, 0);
}

// --- 詳細画面 (閲覧) ---
function showDetailPage(birdId) { 
    appState.currentPage = 'detail'; appState.currentBirdId = birdId; appState.isEditing = false;
    const bird = birdDatabase.find(b => b.id === birdId); if (!bird) { showListPage(); return; } currentBird = bird; 
    const seasonTag = getSeasonTag(bird.season);
    const rarity = parseInt(bird.rarity, 10);
    const rarityTag = !isNaN(rarity) && rarity > 0 ? `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">${'★'.repeat(rarity)}${'☆'.repeat(5 - rarity)}</span>` : '';
    const specialTags = (bird.special_notes || '').split(';').filter(Boolean).map(note => `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">${escapeHTML(note)}</span>`).join(' ');
    const placeholderUrl = './favicon3.png';
    const imageUrl = bird.photo_url || placeholderUrl;
    const opacityClass = bird.photo_url ? '' : 'opacity-30';

    const isPlaceholder = !bird.photo_url;
    
    const buttonIcon = isPlaceholder 
        ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>` 
        : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg>`; 
    
    const buttonTitle = isPlaceholder ? "写真を追加" : "写真を再編集";
    
    const editPhotoBtnHtml = `
        <button id="edit-photo-overlay-btn" class="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors" title="${buttonTitle}">
            ${buttonIcon}
        </button>
    `;
    
    const habitatLabels = getHabitatLabels(bird);
    const habitatText = habitatLabels.length > 0 ? habitatLabels.join(', ') : '(情報なし)';
    
    let latestEventHtml = '';
    if (bird.lastObservedEventId) {
        const latestEvent = birdEvents.find(e => e.id === bird.lastObservedEventId);
        if (latestEvent) {
            const eventDate = latestEvent.dateTime ? latestEvent.dateTime.replace('T', ' ') : '日付不明';
            const eventLocation = latestEvent.location || '(場所未設定)';
            
            latestEventHtml = `
            <div id="latest-event-link" class="bg-emerald-50 rounded-lg shadow overflow-hidden border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors">
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2">最新の観察イベント</h3>
                    <div class="text-sm text-emerald-700 space-y-1">
                        <p><strong>イベント:</strong> ${escapeHTML(latestEvent.name || '無題のイベント')}</p>
                        <p><strong>日時:</strong> ${escapeHTML(eventDate)}</p>
                        <p><strong>場所:</strong> ${escapeHTML(eventLocation)}</p>
                    </div>
                    <p class="text-xs text-emerald-600 mt-2 text-right">タップしてイベント詳細へ &gt;</p>
                </div>
            </div>
            `;
        }
    }
    
    const descriptionHtml = bird.description ? `<p class="text-gray-700 leading-relaxed">${escapeHTML(bird.description).replace(/\n/g, '<br>')}</p>` : `<p class="text-gray-400 italic">(説明未記入)</p>`;

    let voiceButtonHtml = '';
    if (bird.voice_url) {
        voiceButtonHtml = `
            <button id="play-voice-btn" class="text-emerald-600 hover:text-emerald-800 p-2 rounded-full hover:bg-emerald-100">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"></path>
                </svg>
            </button>
        `;
    }

    const liferIcon = (checked, label) => {
        const icon = checked 
            ? `<svg class="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>`
            : `<svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>`;
        return `<span class="flex items-center space-x-2">${icon}<span>${label}</span></span>`;
    };
    const liferHtml = `
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="p-4">
                <h3 class="font-semibold text-gray-800 mb-3">ライフリスト</h3>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                    ${liferIcon(bird.lifer_seen, '目視')}
                    ${liferIcon(bird.lifer_heard, '声')}
                    ${liferIcon(bird.lifer_photo, '写真')}
                    ${liferIcon(bird.lifer_video, '動画')}
                </div>
            </div>
        </div>
    `;


    app.innerHTML = `
        <div class="space-y-4 p-2"> 
            <div class="bg-gray-200 rounded-lg shadow overflow-hidden relative">
                <img src="${imageUrl}" alt="${escapeHTML(bird.name)}" 
                     onerror="this.onerror=null; this.src='${placeholderUrl}';" 
                     class="w-full h-56 object-cover ${opacityClass}">
                ${editPhotoBtnHtml} </div>            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4">
                    <div class="flex flex-wrap gap-2 mb-3">${seasonTag}${rarityTag}${specialTags}</div>
                    
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900">${escapeHTML(bird.name)}</h2>
                            <p class="text-sm text-gray-600 mt-1"><strong>分類:</strong> ${escapeHTML(bird.classification) || 'N/A'}</p>
                        </div>
                        ${voiceButtonHtml} 
                    </div>

                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>サイズ:</strong> ${escapeHTML(bird.size) || 'N/A'}</p>
                        <p><strong>生息地:</strong> ${escapeHTML(habitatText)}</p>
                    </div>
                </div>
            </div>
            
            ${liferHtml} 
            ${latestEventHtml} 

            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2">説明文</h3>
                    ${descriptionHtml}
                </div>
            </div>
            <button id="edit-modal-open-btn" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">
                情報を編集する
            </button>
            <audio id="bird-voice-player" class="hidden" src="${bird.voice_url || ''}"></audio>
        </div>
    `;
    updateHeader('detail', bird.name);

    setTimeout(() => {
        const editModalOpenBtn = document.getElementById('edit-modal-open-btn');
        if (editModalOpenBtn) {
            editModalOpenBtn.onclick = () => renderDetailEditPageAsModal(birdId);
        } else {
            console.error("Edit modal open button not found on detail page.");
        }

        const editPhotoBtn = document.getElementById('edit-photo-overlay-btn');
        if (editPhotoBtn) {
            editPhotoBtn.onclick = () => {
                
                const saveCroppedImage = async (base64Image) => {
                    const idx = birdDatabase.findIndex(b => b.id === birdId);
                    if (idx > -1) {
                        birdDatabase[idx].photo_url = base64Image;
                        await saveDatabase(); 
                        showDetailPage(birdId); 
                    }
                };
                
                const deleteCroppedImage = async () => {
                    const idx = birdDatabase.findIndex(b => b.id === birdId);
                    if (idx > -1) {
                        birdDatabase[idx].photo_url = ''; 
                        await saveDatabase(); 
                        showDetailPage(birdId); 
                    }
                };

                if (isPlaceholder) {
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
                            showCropperModal(event.target.result, saveCroppedImage, null);
                        };
                        reader.readAsDataURL(file);
                    };
                    fileInput.click();
                } else {
                    showCropperModal(bird.photo_url, saveCroppedImage, deleteCroppedImage);
                }
            };
        }
      
        if (bird.lastObservedEventId) {
            const latestEventLink = document.getElementById('latest-event-link');
            if (latestEventLink) {
                latestEventLink.onclick = () => handleGoToEvent(bird.lastObservedEventId);
            }
        }
        
        if (bird.voice_url) {
            const playVoiceBtn = document.getElementById('play-voice-btn');
            const audioPlayer = document.getElementById('bird-voice-player');
            if (playVoiceBtn && audioPlayer) {
                playVoiceBtn.onclick = () => {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                        audioPlayer.currentTime = 0; 
                    }
                };
            }
        }
    }, 0);
}

// --- 詳細画面 (編集 - モーダル版) ---
function renderDetailEditPageAsModal(birdId) { 
    const bird = birdDatabase.find(b => b.id === birdId); 
    if (!bird) { showListPage(); return; } 
    currentBird = bird; 
    
    let newBase64Image = null; 
    let newBase64Voice = null; 
    
    const modal = document.getElementById('edit-form-modal');
    const modalContent = document.getElementById('edit-form-content-area');
    const modalTitle = document.getElementById('edit-form-title');
    const modalCancelBtn = document.getElementById('edit-form-cancel-btn');

    if (!modal || !modalContent || !modalTitle || !modalCancelBtn) {
        console.error("Edit modal elements not found!");
        return;
    }

    modalTitle.textContent = `編集: ${bird.name}`;

    const rarityOptions = [ { value: '', label: '未設定' }, { value: '1', label: '★☆☆☆☆' }, { value: '2', label: '★★☆☆☆' }, { value: '3', label: '★★★☆☆' }, { value: '4', label: '★★★★☆' }, { value: '5', label: '★★★★★' } ];
    const placeholderUrl = './favicon3.png';
    const currentImageUrl = bird.photo_url || placeholderUrl;

    const voiceInputHtml = `
        <div>
            <label for="edit_voice" class="block text-sm font-medium text-gray-700">鳴き声 (音声)</label>
            <div class="mt-2">
                <audio id="voice_preview" controls class="w-full ${!bird.voice_url ? 'hidden' : ''}" src="${bird.voice_url || ''}"></audio>
            </div>
            <input type="file" id="edit_voice" name="voice_file" accept="audio/*" class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
            <p id="voice_message" class="text-xs text-gray-500 mt-1">音声ファイルを選択できます (10MBまで)。</p>
            <button type="button" id="remove_voice_btn" class="mt-2 text-sm font-medium text-red-600 hover:text-red-800 ${!bird.voice_url ? 'hidden' : ''}">
                音声を削除
            </button>
        </div>
    `;
    
    const liferEditHtml = `
        <div class="space-y-3">
            <p class="block text-sm font-medium text-gray-700">ライフリスト（手動編集）</p>
            <p class="text-xs text-gray-500 -mt-2">
                （「イベントから自動更新」がONの場合、ここでOFFにしても、次回のイベント登録で自動的にONに戻る可能性があります）
            </p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-3">
                <label for="edit_lifer_seen" class="flex items-center space-x-2">
                    <input type="checkbox" id="edit_lifer_seen" name="lifer_seen" value="true" ${bird.lifer_seen ? 'checked' : ''} class="form-checkbox text-emerald-600 rounded h-5 w-5">
                    <span>目視</span>
                </label>
                <label for="edit_lifer_heard" class="flex items-center space-x-2">
                    <input type="checkbox" id="edit_lifer_heard" name="lifer_heard" value="true" ${bird.lifer_heard ? 'checked' : ''} class="form-checkbox text-emerald-600 rounded h-5 w-5">
                    <span>声</span>
                </label>
                <label for="edit_lifer_photo" class="flex items-center space-x-2">
                    <input type="checkbox" id="edit_lifer_photo" name="lifer_photo" value="true" ${bird.lifer_photo ? 'checked' : ''} class="form-checkbox text-emerald-600 rounded h-5 w-5">
                    <span>写真</span>
                </label>
                <label for="edit_lifer_video" class="flex items-center space-x-2">
                    <input type="checkbox" id="edit_lifer_video" name="lifer_video" value="true" ${bird.lifer_video ? 'checked' : ''} class="form-checkbox text-emerald-600 rounded h-5 w-5">
                    <span>動画</span>
                </label>
            </div>
        </div>
    `;

    modalContent.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 space-y-4 m-2">
            <div class="space-y-2">
                <div><p class="block text-sm font-medium text-gray-500">名前</p><p class="readonly-field">${escapeHTML(bird.name)}</p></div>
                <div><p class="block text-sm font-medium text-gray-500">分類</p><p class="readonly-field">${escapeHTML(bird.classification)}</p></div>
                 <div><p class="block text-sm font-medium text-gray-500">サイズ</p><p class="readonly-field">${escapeHTML(bird.size)}</p></div>
                <div><p class="block text-sm font-medium text-gray-500">特記</p><p class="readonly-field">${escapeHTML(bird.special_notes) || '(なし)'}</p></div>
            </div>
            <hr class="my-4">
            <form id="editForm" class="space-y-4">
                
                ${voiceInputHtml}
                <hr class="my-4">

                 <div><label for="edit_season" class="block text-sm font-medium text-gray-700">区分</label><select id="edit_season" name="season" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"><option value="" ${!bird.season ? 'selected' : ''}>未設定</option>${filterableSeasons.map(s => `<option value="${s}" ${bird.season === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                <div><label for="edit_rarity" class="block text-sm font-medium text-gray-700">レア度</label><select id="edit_rarity" name="rarity" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">${rarityOptions.map(opt => `<option value="${opt.value}" ${bird.rarity === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}</select></div>
                
                <hr class="my-4">
                ${liferEditHtml} 
                <hr class="my-4">
                
                <div>
                    <p class="block text-sm font-medium text-gray-500">最新の観察日時 (イベント連携)</p>
                    <p class="readonly-field">${escapeHTML(bird.observed_date ? bird.observed_date.replace('T', ' ') : '(記録なし)')}</p>
                    <input type="hidden" id="edit_date" name="observed_date" value="${escapeHTML(bird.observed_date || '')}">
                </div>
                <div>
                    <p class="block text-sm font-medium text-gray-500">最新の観察場所 (イベント連携)</p>
                    <p class="readonly-field">${escapeHTML(bird.observed_location || '(記録なし)')}</p>
                    <input type="hidden" id="edit_location" name="observed_location" value="${escapeHTML(bird.observed_location || '')}">
                </div>

                <div><label for="edit_desc" class="block text-sm font-medium text-gray-700">説明文</label><textarea id="edit_desc" name="description" rows="5" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="特徴や鳴き声など...">${escapeHTML(bird.description || '')}</textarea></div>
                
                <button type="submit" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">保存する</button>
            </form>
        </div>
    `;
    
    modalContent.scrollTop = 0;

    setTimeout(() => {
        const editForm = document.getElementById('editForm');
        
        const voiceInput = document.getElementById('edit_voice');
        const voicePreview = document.getElementById('voice_preview');
        const removeVoiceBtn = document.getElementById('remove_voice_btn');
        const voiceMessage = document.getElementById('voice_message');
        
        if (voiceInput) {
            voiceInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) {
                    newBase64Voice = null;
                    return;
                }
                if (file.size > 10 * 1024 * 1024) { 
                    showCustomConfirm("音声サイズが10MBを超えています。10MB以下のファイルを選択してください。", "OK", true); 
                    e.target.value = null;
                    newBase64Voice = null;
                    voicePreview.src = bird.voice_url || '';
                    voicePreview.classList.toggle('hidden', !bird.voice_url);
                    voiceMessage.textContent = "10MB以下の音声を選択してください。";
                    voiceMessage.classList.add('text-red-600');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    newBase64Voice = event.target.result; 
                    voicePreview.src = newBase64Voice;
                    voicePreview.classList.remove('hidden');
                    removeVoiceBtn.classList.remove('hidden');
                    voiceMessage.textContent = "音声が選択されました。";
                    voiceMessage.classList.remove('text-red-600');
                };
                reader.onerror = (error) => {
                    console.error("File reading error:", error);
                    showCustomConfirm("音声の読み込みに失敗しました。", "OK", true); 
                    newBase64Voice = null;
                };
                reader.readAsDataURL(file);
            });
        }
        if (removeVoiceBtn) {
            removeVoiceBtn.onclick = async () => {
                const confirmed = await showCustomConfirm(
                    '本当にこの音声を削除しますか？\n（「保存する」ボタンを押すまで確定されません）',
                    '音声を削除'
                );
                if (confirmed) {
                    newBase64Voice = ""; 
                    voicePreview.src = '';
                    voicePreview.classList.add('hidden');
                    voiceInput.value = null;
                    removeVoiceBtn.classList.add('hidden');
                    voiceMessage.textContent = "音声は削除されます（保存時に確定）。";
                    voiceMessage.classList.remove('text-red-600');
                }
            };
        }
        
        const handleFormSubmit = async (event) => {
            if (event) event.preventDefault();
            await handleSave(editForm, newBase64Voice); 
        };

        if (editForm) {
            editForm.onsubmit = handleFormSubmit;
        }

    }, 0);

    const newCancelBtn = modalCancelBtn.cloneNode(true);
    modalCancelBtn.parentNode.replaceChild(newCancelBtn, modalCancelBtn);
    newCancelBtn.onclick = () => {
        modal.classList.add('hidden'); 
        modalContent.innerHTML = '';    
    };
    
    modal.classList.remove('hidden');
}

// --- 編集保存 ---
async function handleSave(formElement, newBase64Voice) { 
    
    const formData = new FormData(formElement);
    const birdId = appState.currentBirdId;
    
    const idx = birdDatabase.findIndex(b => b.id === birdId); 
    if (idx === -1) {
        console.error("Bird not found in memory DB.");
        return;
    }

    LOCAL_COLUMNS.forEach(key => { 
        if (formData.has(key)) {
            if (key !== 'photo_url' && key !== 'voice_url' && 
                key !== 'observed_date' && key !== 'observed_location' &&
                !key.startsWith('lifer_')) {
                birdDatabase[idx][key] = formData.get(key);
            }
        } 
    });
    
    
    if (newBase64Voice !== null) {
        birdDatabase[idx]['voice_url'] = newBase64Voice;
    }
    
    birdDatabase[idx]['lifer_seen'] = formElement.querySelector('#edit_lifer_seen').checked;
    birdDatabase[idx]['lifer_heard'] = formElement.querySelector('#edit_lifer_heard').checked;
    birdDatabase[idx]['lifer_photo'] = formElement.querySelector('#edit_lifer_photo').checked;
    birdDatabase[idx]['lifer_video'] = formElement.querySelector('#edit_lifer_video').checked;


    try {
        await saveDatabase(); 
        
        const modal = document.getElementById('edit-form-modal');
        const modalContent = document.getElementById('edit-form-content-area');
        if (modal) modal.classList.add('hidden');
        if (modalContent) modalContent.innerHTML = ''; 
        
        showDetailPage(birdId);
        
    } catch (error) {
        console.error("Failed to save bird data:", error);
        showCustomConfirm("データの保存に失敗しました。", "OK", true); 
    }
}

function handleGoToEvent(eventId) {
    if (!eventId) return;
    
    const eventIndex = birdEvents.findIndex(e => e.id === eventId);
    
    if (eventIndex > -1) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.replace('tab-active', 'tab-inactive'));
        const eventsTab = document.getElementById('tab-events');
        if (eventsTab) {
            eventsTab.classList.replace('tab-inactive', 'tab-active');
        }
        
        showEventDetail(eventIndex);

        window.scrollTo(0, 0); 
    } else {
        console.warn(`Event with ID ${eventId} not found.`);
        console.warn("エラー: 該当のイベントが見つかりませんでした。");
    }
}