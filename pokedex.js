// --- 画面描画: 図鑑リスト ---
function showListPage() { 
    appState.currentPage = 'list'; appState.isEditing = false;
    console.log(`showListPage called. birdDatabase length: ${birdDatabase ? birdDatabase.length : 'null'}, loadError: ${localStorage.getItem('birdDatabaseLoadError')}`); 
    
    if (localStorage.getItem('birdDatabaseLoadError')) {
        app.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">データ読み込みエラー</strong><span class="block sm:inline">図鑑データの読み込みに失敗しました。データが破損している可能性があります。</span><p class="mt-2">「設定」タブから「全データ消去」を実行し、再度「今すぐ同期する」ボタンを押してください。</p></div>`;
        updateHeader('list', 'エラー'); 
        return;
    } else if (!birdDatabase || birdDatabase.length === 0) {
         if (GITHUB_CSV_URL.includes('[YOUR_USERNAME]')) {
            app.innerHTML = `<div class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow" role="alert"><strong class="font-bold">初期設定が必要です</strong><span class="block sm:inline">アプリのURL設定が完了していません。「設定」タブでURLを確認してください。</span></div>`;
        } else {
             app.innerHTML = `<div class="bg-white rounded-lg shadow p-6 text-center"><h2 class="text-xl font-semibold mb-4">ようこそ</h2><p class="text-gray-600">図鑑データが空です。「設定」タブから「今すぐ同期する」ボタンを押してください。</p></div>`;
        }
        updateHeader('list'); 
        return;
    }

    app.innerHTML = `<div id="pokedex-list-container"><div id="pokedex-list"></div><div id="pagination-controls" class="mt-6 flex justify-between items-center"></div></div>`;
    updateHeader('list'); 
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
}

// --- ポップアップ描画 (図鑑: 検索) ---
function renderSearchPopup() { 
    const { filterText } = appState.listControls; const filterStatus = getFilterStatus(); 
    searchPopup.innerHTML = `<input type="search" id="searchBox" placeholder="鳥を検索..." value="${escapeHTML(filterText)}" class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" autocomplete="off"><p id="search-status-text" class="text-xs text-green-600 mt-1">${filterStatus.isTextFiltered ? '検索中...' : ''}</p><div id="search-suggestions" class="mt-2 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-lg max-h-48 overflow-y-auto"></div>`;
    const searchBox = searchPopup.querySelector('#searchBox');
    searchBox.addEventListener('input', (e) => {
        const newText = e.target.value; appState.listControls.filterText = newText; appState.listControls.currentPage = 1; 
        applyFiltersAndRenderList(); renderSearchSuggestions(getSearchSuggestions(newText)); saveListControlsState(); // getSearchSuggestionsはapp.jsのものを使用
        const currentStatus = getFilterStatus(); filterActiveDot.classList.toggle('hidden', !currentStatus.isFiltered);
        const statusElem = searchPopup.querySelector('#search-status-text'); if(statusElem) statusElem.textContent = currentStatus.isTextFiltered ? '検索中...' : '';
    });
    if (filterText) renderSearchSuggestions(getSearchSuggestions(filterText)); // getSearchSuggestionsはapp.jsのものを使用
    searchBox.focus();
}

// ★ 削除: getSearchSuggestions 関数は app.js に移動

function renderSearchSuggestions(suggestions) { 
    const box = searchPopup.querySelector('#search-suggestions'); if (!box) return; 
    if (suggestions.length === 0) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = suggestions.map(n => `<div class="p-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 search-suggestion-item" data-name="${escapeHTML(n)}">${escapeHTML(n)}</div>`).join(''); 
    box.querySelectorAll('.search-suggestion-item').forEach(item => item.addEventListener('click', () => selectSearchSuggestion(item.dataset.name)));
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
        { id: 'classification', title: '分類 (目)' }, { id: 'type', title: '種類' }, { id: 'season', title: '区分' },
        { id: 'habitat', title: '生息地' }, { id: 'size', title: '体サイズ' }, { id: 'edited', title: '編集あり' } 
    ];
    const createSelectButtons = (id) => `<div class="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2"><button class="select-all-btn text-xs font-medium text-emerald-600 hover:text-emerald-800" data-section="${id}">全選択</button><button class="select-none-btn text-xs font-medium text-gray-500 hover:text-gray-700" data-section="${id}">全解除</button></div>`;
    filterPopup.innerHTML = filterSections.map(section => {
        const isOpen = openFilterSection === section.id; let isFiltered = false;
        switch(section.id) {
            case 'classification': isFiltered = filterStatus.isClassificationFiltered; break; case 'type': isFiltered = filterStatus.isTypeFiltered; break;
            case 'season': isFiltered = filterStatus.isSeasonFiltered; break; case 'habitat': isFiltered = filterStatus.isHabitatFiltered; break;
            case 'size': isFiltered = filterStatus.isSizeFiltered; break; case 'edited': isFiltered = filterStatus.isEditedFiltered; break; 
        }
        const filteredClass = isFiltered ? 'filtered' : ''; let contentHtml = '';
        switch (section.id) {
            case 'classification': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + allOrders.map(o => `<label class="flex items-center space-x-2"><input type="checkbox" name="classification_order" value="${o}" ${filters.classification.orders.includes(o)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${o}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'type': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + filterableTypes.map(t => `<label class="flex items-center space-x-2"><input type="checkbox" name="type" value="${t}" ${filters.type.includes(t)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${t}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'season': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + filterableSeasons.map(s => `<label class="flex items-center space-x-2"><input type="checkbox" name="season" value="${s}" ${filters.season.includes(s)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${s}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'habitat': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + habitatKeys.map(h => `<label class="flex items-center space-x-2"><input type="checkbox" name="habitat" value="${h.key}" ${filters.habitat.includes(h.key)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${h.label}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'size': contentHtml = `<div class="p-4"><div class="grid grid-cols-2 gap-2">` + Object.entries(sizeRanges).map(([k,r]) => `<label class="flex items-center space-x-2"><input type="checkbox" name="size" value="${k}" ${filters.size.includes(k)?'checked':''} class="form-checkbox text-emerald-600 rounded"><span>${r.label}</span></label>`).join('') + `</div>${createSelectButtons(section.id)}</div>`; break;
            case 'edited': contentHtml = `<div class="p-4 space-y-2"><label class="flex items-center space-x-2"><input type="radio" name="edited" value="all" ${filters.edited==='all'?'checked':''} class="form-radio text-emerald-600"><span>すべて</span></label><label class="flex items-center space-x-2"><input type="radio" name="edited" value="yes" ${filters.edited==='yes'?'checked':''} class="form-radio text-emerald-600"><span>編集あり (写真)</span></label></div>`; break;
        }
        return `<div class="border-b border-gray-200"><button class="accordion-header w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 ${filteredClass}" data-section="${section.id}"><span>${section.title}</span><svg class="h-5 w-5 ${isOpen?'arrow-up':'arrow-down'}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></button><div class="accordion-content bg-white" style="${isOpen?'max-height: 500px;':''}">${contentHtml}</div></div>`;
    }).join('');
    filterPopup.querySelectorAll('.accordion-header').forEach(btn => btn.addEventListener('click', () => {
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
    viewPopup.innerHTML = `<div class="p-4 space-y-4"><div><h3 class="text-sm font-semibold text-gray-500 mb-2">並び替え</h3><div class="space-y-2">${sortOptions.map(o => `<label class="flex items-center space-x-2"><input type="radio" name="sort" value="${o.value}" ${sort===o.value?'checked':''} class="form-radio text-emerald-600"><span>${o.label}</span></label>`).join('')}</div></div><div class="pt-4 border-t border-gray-200"><h3 class="text-sm font-semibold text-gray-500 mb-2">表示形式</h3><div class="space-y-2">${viewOptions.map(o => `<label class="flex items-center space-x-2"><input type="radio" name="viewMode" value="${o.value}" ${viewMode===o.value?'checked':''} class="form-radio text-emerald-600"><span>${o.label}</span></label>`).join('')}</div></div></div>`;
    viewPopup.querySelectorAll('input[name="sort"]').forEach(r => r.addEventListener('change', (e) => { appState.listControls.sort = e.target.value; appState.listControls.currentPage = 1; applyFiltersAndRenderList(); saveListControlsState(); }));
    viewPopup.querySelectorAll('input[name="viewMode"]').forEach(r => r.addEventListener('change', (e) => { appState.listControls.viewMode = e.target.value; appState.listControls.currentPage = 1; applyFiltersAndRenderList(); saveListControlsState(); }));
}

// --- 図鑑リスト描画 ---
function applyFiltersAndRenderList() {
    const listContainer = document.getElementById('pokedex-list-container'); if (!listContainer) return; 
    const listElement = listContainer.querySelector('#pokedex-list');
    if (!listElement) return; 
    
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
        const matchesEdited = filters.edited === 'all' || (filters.edited === 'yes' && bird.photo_url); 
        return matchesSearch && matchesSeason && matchesType && matchesClassification && matchesHabitat && matchesSize && matchesEdited; 
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
            case 'rarity_asc': { 
                const rarityA = getRarityNum(a.rarity); const rarityB = getRarityNum(b.rarity);
                if (rarityA === 99 && rarityB === 99) return 0; if (rarityA === 99) return 1; if (rarityB === 99) return -1; 
                return rarityA - rarityB; 
            }
            case 'rarity_desc': { 
                const rarityA = getRarityNum(a.rarity); const rarityB = getRarityNum(b.rarity);
                if (rarityA === 99 && rarityB === 99) return 0; if (rarityA === 99) return 1; if (rarityB === 99) return -1; 
                return rarityB - rarityA; 
            }
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
            listElement.className = 'grid grid-cols-2 gap-4';
            listElement.innerHTML = paginatedList.map(bird => {
                const placeholderUrl = `https://placehold.co/150x150/e0e0e0/b0b0b0?text=${escapeHTML(bird.name.charAt(0))}`;
                const imageUrl = bird.photo_url || placeholderUrl;
                const seasonTag = getSeasonTag(bird.season);
                const habitatLabels = getHabitatLabels(bird); 
                const habitatText = habitatLabels.join(', '); 
                const habitatHtml = habitatText ? `<span class="text-xs text-gray-500 leading-tight">${escapeHTML(habitatText)}</span>` : ''; 
                
                return `
                    <div class="bg-white rounded-lg shadow overflow-hidden cursor-pointer" onclick="showDetailPage('${bird.id}')">
                        <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(bird.name)}" 
                             onerror="this.onerror=null; this.src='${placeholderUrl}';"
                             class="w-full h-32 object-cover">
                        <div class="p-3">
                            <h3 class="font-semibold text-gray-800 mb-1 truncate">${escapeHTML(bird.name)}</h3>
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
                return `
                    <div class="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center" onclick="showDetailPage('${bird.id}')">
                        <h3 class="font-semibold text-gray-800">${escapeHTML(bird.name)}</h3>
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
    // (★修正) currentPage を state から直接読む
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
}

// --- 詳細画面 (閲覧) ---
function showDetailPage(birdId) { 
    appState.currentPage = 'detail'; appState.currentBirdId = birdId; appState.isEditing = false;
    const bird = birdDatabase.find(b => b.id === birdId); if (!bird) { showListPage(); return; } currentBird = bird; 
    const seasonTag = getSeasonTag(bird.season);
    const rarity = parseInt(bird.rarity, 10);
    const rarityTag = !isNaN(rarity) && rarity > 0 ? `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">${'★'.repeat(rarity)}${'☆'.repeat(5 - rarity)}</span>` : '';
    const specialTags = (bird.special_notes || '').split(';').filter(Boolean).map(note => `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">${escapeHTML(note)}</span>`).join(' ');
    const placeholderUrl = `https://placehold.co/600x400/e0e0e0/b0b0b0?text=${escapeHTML(bird.name.charAt(0))}`;
    const imageUrl = bird.photo_url || placeholderUrl;
    const habitatLabels = getHabitatLabels(bird);
    const habitatText = habitatLabels.length > 0 ? habitatLabels.join(', ') : '(情報なし)';
    const observationHtml = bird.observed_date || bird.observed_location ? `<div class="bg-white rounded-lg shadow overflow-hidden"><div class="p-4"><h3 class="font-semibold text-gray-800 mb-2">観察記録</h3><div class="text-sm text-gray-600 space-y-1">${bird.observed_date ? `<p><strong>日時:</strong> ${escapeHTML(bird.observed_date)}</p>` : ''}${bird.observed_location ? `<p><strong>場所:</strong> ${escapeHTML(bird.observed_location)}</p>` : ''}</div></div></div>` : '';
    const descriptionHtml = bird.description ? `<p class="text-gray-700 leading-relaxed">${escapeHTML(bird.description).replace(/\n/g, '<br>')}</p>` : `<p class="text-gray-400 italic">(説明未記入)</p>`;

    app.innerHTML = `
        <div class="space-y-4">
            <div class="bg-gray-200 rounded-lg shadow overflow-hidden">
                <img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(bird.name)}" onerror="this.onerror=null; this.src='${placeholderUrl}';" class="w-full h-56 object-cover">
            </div>
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4">
                    <div class="flex flex-wrap gap-2 mb-3">${seasonTag}${rarityTag}${specialTags}</div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">${escapeHTML(bird.name)}</h2>
                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>分類:</strong> ${escapeHTML(bird.classification) || 'N/A'}</p>
                        <p><strong>サイズ:</strong> ${escapeHTML(bird.size) || 'N/A'}</p>
                        <p><strong>生息地:</strong> ${escapeHTML(habitatText)}</p>
                    </div>
                </div>
            </div>
            ${observationHtml}
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2">説明文</h3>
                    ${descriptionHtml}
                </div>
            </div>
            <button id="editButton" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">
                情報を編集する
            </button>
        </div>
    `;
    updateHeader('detail', bird.name);
    document.getElementById('editButton').onclick = () => renderDetailEditPage(birdId);
}

// --- 詳細画面 (編集) ---
function renderDetailEditPage(birdId) { 
    appState.currentPage = 'edit'; appState.isEditing = true;
    const bird = birdDatabase.find(b => b.id === birdId); if (!bird) { showListPage(); return; } currentBird = bird;
    const rarityOptions = [ { value: '', label: '未設定' }, { value: '1', label: '★☆☆☆☆' }, { value: '2', label: '★★☆☆☆' }, { value: '3', label: '★★★☆☆' }, { value: '4', label: '★★★★☆' }, { value: '5', label: '★★★★★' } ];
    app.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 space-y-4">
            <h2 class="text-xl font-bold text-gray-900 mb-2">情報の編集</h2>
            <div class="space-y-2">
                <div><label class="block text-sm font-medium text-gray-500">名前</label><p class="readonly-field">${escapeHTML(bird.name)}</p></div>
                <div><label class="block text-sm font-medium text-gray-500">分類</label><p class="readonly-field">${escapeHTML(bird.classification)}</p></div>
                 <div><label class="block text-sm font-medium text-gray-500">サイズ</label><p class="readonly-field">${escapeHTML(bird.size)}</p></div>
                <div><label class="block text-sm font-medium text-gray-500">特記</label><p class="readonly-field">${escapeHTML(bird.special_notes) || '(なし)'}</p></div>
            </div>
            <hr class="my-4">
            <form id="editForm" class="space-y-4">
                <div><label for="edit_photo" class="block text-sm font-medium text-gray-700">写真URL</label><input type="url" id="edit_photo" name="photo_url" value="${escapeHTML(bird.photo_url || '')}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="https://..."></div>
                 <div><label for="edit_season" class="block text-sm font-medium text-gray-700">区分</label><select id="edit_season" name="season" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"><option value="" ${!bird.season ? 'selected' : ''}>未設定</option>${filterableSeasons.map(s => `<option value="${s}" ${bird.season === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                <div><label for="edit_rarity" class="block text-sm font-medium text-gray-700">レア度</label><select id="edit_rarity" name="rarity" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500">${rarityOptions.map(opt => `<option value="${opt.value}" ${bird.rarity === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}</select></div>
                <div><label for="edit_date" class="block text-sm font-medium text-gray-700">観察日時</label><input type="text" id="edit_date" name="observed_date" value="${escapeHTML(bird.observed_date || '')}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="2024-01-01 10:00"></div>
                <div><label for="edit_location" class="block text-sm font-medium text-gray-700">観察場所</label><input type="text" id="edit_location" name="observed_location" value="${escapeHTML(bird.observed_location || '')}" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="〇〇公園"></div>
                <div><label for="edit_desc" class="block text-sm font-medium text-gray-700">説明文</label><textarea id="edit_desc" name="description" rows="5" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="特徴や鳴き声など...">${escapeHTML(bird.description || '')}</textarea></div>
                <button type="submit" class="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-emerald-700 transition-colors">保存する</button>
            </form>
        </div>
    `;
    updateHeader('edit', `編集: ${bird.name}`);
    document.getElementById('editForm').onsubmit = handleSave;
}

// --- 編集保存 ---
function handleSave(event) { 
    event.preventDefault(); const formData = new FormData(event.target); const birdId = appState.currentBirdId;
    const idx = birdDatabase.findIndex(b => b.id === birdId); if (idx === -1) return;
    LOCAL_COLUMNS.forEach(key => { if (formData.has(key)) birdDatabase[idx][key] = formData.get(key); });
    saveDatabase(); showDetailPage(birdId);
}

