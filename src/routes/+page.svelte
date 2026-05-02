<!-- src/routes/artikel/+page.svelte -->
<script>
    import SearchableSelect from '$lib/components/SearchableSelect.svelte';
    
    export let data;
    const { categories, articles, attributes } = data;

    // --- 1. State für Suche & Kategorien ---
    let searchQuery = "";
    let selectedMainCategoryId = "";
    let selectedSubcategoryId = "";

    $: mainCategoryOptions = categories.map(cat => ({ value: cat._id, label: cat.name }));
    $: selectedMainCategory = categories.find(cat => cat._id === selectedMainCategoryId) || null;
    $: availableSubcategories = selectedMainCategory ? selectedMainCategory.subcategories : [];
    $: subCategoryOptions = availableSubcategories.map(sub => ({ value: sub.id, label: sub.name }));

    let previousMain = "";
    $: if (selectedMainCategoryId !== previousMain) {
        selectedSubcategoryId = "";
        previousMain = selectedMainCategoryId;
    }

    // --- 2. BASIS-FILTER (Kategorie & Suche) ---
    $: baseFilteredArticles = articles.filter(article => {
        const matchSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchMainCategory = selectedMainCategoryId === "" || article.mainCategoryId === selectedMainCategoryId;
        const matchSubCategory = selectedSubcategoryId === "" || article.subcategoryId === selectedSubcategoryId;
        return matchSearch && matchMainCategory && matchSubCategory;
    });

    // --- 3. DYNAMISCHE SIDEBAR-FILTER ---
    $: availableSidebarFilters = (() => {
        const attrMap = {}; 
        
        baseFilteredArticles.forEach(article => {
            if (article.attributes) {
                for (const [attrId, value] of Object.entries(article.attributes)) {
                    if (value !== undefined && value !== "") {
                        if (!attrMap[attrId]) attrMap[attrId] = new Set();
                        
                        if (Array.isArray(value)) {
                            value.forEach(v => attrMap[attrId].add(v));
                        } else {
                            attrMap[attrId].add(value);
                        }
                    }
                }
            }
        });

        const result = [];
        for (const [attrId, valueSet] of Object.entries(attrMap)) {
            const attrDef = attributes.find(a => a._id === attrId);
            
            if (attrDef) {
                const optionsArr = Array.from(valueSet);
                const unitStr = attrDef.unit ? ` ${attrDef.unit}` : '';

                if (attrDef.ui_type === 'number') {
                    const numValues = optionsArr.map(v => parseFloat(String(v).replace(',', '.'))).filter(v => !isNaN(v));

                    if (numValues.length > 0) {
                        const min = Math.min(...numValues);
                        const max = Math.max(...numValues);
                        
                        if (min < max) {
                            result.push({
                                id: attrId,
                                label: attrDef.label,
                                type: 'range',
                                absMin: min,
                                absMax: max,
                                unit: unitStr
                            });
                            continue; 
                        }
                    }
                }

                result.push({
                    id: attrId,
                    label: attrDef.label,
                    type: 'modal',
                    options: optionsArr.sort((a, b) => String(a).localeCompare(String(b), 'de', { sensitivity: 'base', numeric: true })),
                    unit: unitStr
                });
            }
        }
        return result.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
    })();

    // --- FILTER-SUCHE IN DER SIDEBAR ---
    let sidebarAttributeSearch = "";
    $: visibleSidebarFilters = availableSidebarFilters.filter(filter => 
        filter.label.toLowerCase().includes(sidebarAttributeSearch.toLowerCase())
    );

    // --- 4. DETAIL-FILTER STATES ---
    let selectedAttributeFilters = {}; 
    let activeRangeFilters = {};       
    let isMobileFilterOpen = false;

    // --- MODAL STATE & LOGIK ---
    let activeFilterModal = null;    
    let tempSelectedOptions = [];    
    
    let modalSearchQuery = "";
    $: filteredModalOptions = activeFilterModal 
        ? activeFilterModal.options.filter(opt => String(opt).toLowerCase().includes(modalSearchQuery.toLowerCase()))
        : [];

    function openFilterModal(filter) {
        activeFilterModal = filter;
        tempSelectedOptions = selectedAttributeFilters[filter.id] ? [...selectedAttributeFilters[filter.id]] : [];
        modalSearchQuery = ""; 
    }

    function closeFilterModal() {
        activeFilterModal = null;
        tempSelectedOptions = [];
        modalSearchQuery = ""; 
    }

    function toggleTempOption(opt) {
        if (tempSelectedOptions.includes(opt)) {
            tempSelectedOptions = tempSelectedOptions.filter(v => v !== opt);
        } else {
            tempSelectedOptions = [...tempSelectedOptions, opt];
        }
    }

    // NEU: Funktion, um alle temp. Auswahlen im Modal zu löschen
    function deselectAllTempOptions() {
        tempSelectedOptions = [];
    }

    function confirmFilterModal() {
        if (tempSelectedOptions.length > 0) {
            selectedAttributeFilters[activeFilterModal.id] = [...tempSelectedOptions];
        } else {
            delete selectedAttributeFilters[activeFilterModal.id];
        }
        selectedAttributeFilters = { ...selectedAttributeFilters }; 
        closeFilterModal();
    }
    // --------------------------------

    function updateRange(attrId, type, rawValue, absMin, absMax) {
        let val = parseFloat(String(rawValue).replace(',', '.'));
        if (isNaN(val)) return;

        if (!activeRangeFilters[attrId]) {
            activeRangeFilters[attrId] = { min: absMin, max: absMax };
        }

        if (type === 'min') {
            if (val > activeRangeFilters[attrId].max) val = activeRangeFilters[attrId].max;
            activeRangeFilters[attrId].min = val;
        } else {
            if (val < activeRangeFilters[attrId].min) val = activeRangeFilters[attrId].min;
            activeRangeFilters[attrId].max = val;
        }
        
        activeRangeFilters = { ...activeRangeFilters };
    }

    function clearAttributeFilters() {
        selectedAttributeFilters = {};
        activeRangeFilters = {};
    }

    // --- 5. FINALES ARRAY FÜR DIE KARTEN ---
    $: finalFilteredArticles = baseFilteredArticles.filter(article => {
        for (const [attrId, selectedValues] of Object.entries(selectedAttributeFilters)) {
            if (selectedValues && selectedValues.length > 0) {
                const articleValue = article.attributes ? article.attributes[attrId] : undefined;
                if (articleValue === undefined) return false; 

                if (Array.isArray(articleValue)) {
                    const hasMatch = selectedValues.some(val => articleValue.includes(val));
                    if (!hasMatch) return false;
                } else {
                    if (!selectedValues.includes(articleValue)) return false;
                }
            }
        }

        for (const [attrId, range] of Object.entries(activeRangeFilters)) {
            if (!article.attributes || article.attributes[attrId] === undefined) return false;
            const val = parseFloat(String(article.attributes[attrId]).replace(',', '.'));
            if (isNaN(val) || val < range.min || val > range.max) {
                return false;
            }
        }
        return true; 
    });
</script>

<div class="page-container">
    <div class="header">
        <h1>Artikelübersicht</h1>
        <a href="/addarticle" class="btn-primary">+ Neuer Artikel</a>
    </div>

    <!-- TOP-BAR -->
    <div class="top-bar">
        <div class="filter-left">
            <div class="dropdown-group">
                <label>Hauptkategorie</label>
                <SearchableSelect name="filterMain" options={mainCategoryOptions} bind:value={selectedMainCategoryId} placeholder="Alle Hauptkategorien" />
            </div>
            {#if subCategoryOptions.length > 0}
                <div class="dropdown-group">
                    <label>Unterkategorie</label>
                    <SearchableSelect name="filterSub" options={subCategoryOptions} bind:value={selectedSubcategoryId} placeholder="Alle Unterkategorien" />
                </div>
            {/if}
        </div>
        <div class="filter-right">
            <div class="search-box">
                <label for="search">Suchen</label>
                <div class="search-mobile-wrapper">
                    <input type="text" id="search" bind:value={searchQuery} placeholder="Artikelname eingeben..." />
                    
                    <button class="btn-mobile-filter" on:click={() => isMobileFilterOpen = true}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        Filter
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="content-wrapper">
        
        <!-- LINKE SEITE: Grid -->
        <div class="articles-section">
            <div class="results-info">Zeige {finalFilteredArticles.length} von {articles.length} Artikeln</div>

            <div class="article-grid">
                {#each finalFilteredArticles as article}
                    <div class="card">
                        <div class="card-image">
                            {#if article.imagePath}
                                <img src={article.imagePath} alt={article.title} />
                            {:else}
                                <div class="no-image">Kein Bild</div>
                            {/if}
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">{article.title}</h3>
                            {#if article.price}<p class="card-price">CHF {article.price.toFixed(2)}</p>{/if}
                            <a href={`/${article._id}`} class="btn-details">Details ansehen</a>
                        </div>
                    </div>
                {/each}
                {#if finalFilteredArticles.length === 0}
                    <div class="no-results">Es wurden keine Artikel gefunden.</div>
                {/if}
            </div>
        </div>

        <!-- HINTERGRUND OVERLAY (MOBILE SIDEBAR) -->
        {#if isMobileFilterOpen}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="mobile-overlay" on:click={() => isMobileFilterOpen = false}></div>
        {/if}

        <!-- RECHTE SEITE: Filter-Sidebar -->
        <div class="sidebar-section" class:is-open={isMobileFilterOpen}>
            
            <div class="sidebar-top">
                <div class="sidebar-header">
                    <h3>Spezifikationen</h3>
                    <div class="sidebar-header-actions">
                        {#if Object.values(selectedAttributeFilters).some(arr => arr?.length > 0) || Object.keys(activeRangeFilters).length > 0}
                            <button class="btn-clear" on:click={clearAttributeFilters}>Löschen</button>
                        {/if}
                        <button class="btn-close-sidebar" on:click={() => isMobileFilterOpen = false}>&times;</button>
                    </div>
                </div>

                <div class="sidebar-search">
                    <input 
                        type="text" 
                        bind:value={sidebarAttributeSearch} 
                        placeholder="Attribut suchen (z.B. Farbe)..." 
                        class="sidebar-search-input" 
                    />
                </div>
            </div>

            <div class="sidebar-bottom">
                {#if visibleSidebarFilters.length === 0}
                    <p class="no-filters-text">Keine passenden Filter verfügbar.</p>
                {:else}
                    <div class="sidebar-filters-list">
                        {#each visibleSidebarFilters as filter (filter.id)}
                            <div class="filter-group">
                                <h4 class="filter-group-title">{filter.label}</h4>
                                
                                {#if filter.type === 'modal'}
                                    <button class="btn-open-modal" on:click={() => openFilterModal(filter)}>
                                        <span class="modal-btn-text">
                                            {#if selectedAttributeFilters[filter.id]?.length > 0}
                                                <span class="badge">{selectedAttributeFilters[filter.id].length}</span> 
                                                ausgewählt
                                            {:else}
                                                {filter.label} wählen...
                                            {/if}
                                        </span>
                                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>
                                
                                {:else if filter.type === 'range'}
                                    <div class="range-filter-wrapper">
                                        <div class="range-inputs">
                                            <div class="input-with-unit">
                                                <input type="number" 
                                                    value={activeRangeFilters[filter.id]?.min ?? filter.absMin}
                                                    on:input={(e) => updateRange(filter.id, 'min', e.target.value, filter.absMin, filter.absMax)}
                                                    min={filter.absMin} max={filter.absMax} step="any" class="range-num-input" />
                                                {#if filter.unit}<span class="unit-label">{filter.unit.trim()}</span>{/if}
                                            </div>
                                            <span class="range-separator">-</span>
                                            <div class="input-with-unit">
                                                <input type="number" 
                                                    value={activeRangeFilters[filter.id]?.max ?? filter.absMax}
                                                    on:input={(e) => updateRange(filter.id, 'max', e.target.value, filter.absMin, filter.absMax)}
                                                    min={filter.absMin} max={filter.absMax} step="any" class="range-num-input" />
                                                {#if filter.unit}<span class="unit-label">{filter.unit.trim()}</span>{/if}
                                            </div>
                                        </div>
                                        
                                        <div class="dual-slider">
                                            <input type="range" 
                                                value={activeRangeFilters[filter.id]?.min ?? filter.absMin}
                                                on:input={(e) => updateRange(filter.id, 'min', e.target.value, filter.absMin, filter.absMax)}
                                                min={filter.absMin} max={filter.absMax} step="any" />
                                            <input type="range" 
                                                value={activeRangeFilters[filter.id]?.max ?? filter.absMax}
                                                on:input={(e) => updateRange(filter.id, 'max', e.target.value, filter.absMin, filter.absMax)}
                                                min={filter.absMin} max={filter.absMax} step="any" />
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- DAS FILTER-MODAL -->
{#if activeFilterModal}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="modal-fullscreen-backdrop" on:click={closeFilterModal}></div>
    
    <div class="modal-window">
        <div class="modal-header">
            <h3>{activeFilterModal.label} auswählen</h3>
            <button class="btn-close-modal" on:click={closeFilterModal}>&times;</button>
        </div>
        
        {#if activeFilterModal.options.length > 5}
            <div class="modal-search-area">
                <input 
                    type="text" 
                    bind:value={modalSearchQuery} 
                    placeholder="In {activeFilterModal.label} suchen..." 
                    class="modal-search-field"
                />
            </div>
        {/if}
        
        <div class="modal-body">
            <div class="modal-options-grid">
                {#each filteredModalOptions as opt}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div 
                        class="modal-option-card" 
                        class:selected={tempSelectedOptions.includes(opt)}
                        on:click={() => toggleTempOption(opt)}
                    >
                        <div class="checkbox-indicator">
                            {#if tempSelectedOptions.includes(opt)}
                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="white" stroke-width="3" fill="none">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            {/if}
                        </div>
                        <span class="option-text">{opt}{activeFilterModal.unit}</span>
                    </div>
                {/each}

                {#if filteredModalOptions.length === 0}
                    <div class="no-modal-results">
                        Keine Treffer für "{modalSearchQuery}" gefunden.
                    </div>
                {/if}
            </div>
        </div>

        <!-- MODAL FOOTER (Neu angeordnet für den "Alle abwählen"-Button) -->
        <div class="modal-footer">
            <div class="footer-left">
                {#if tempSelectedOptions.length > 0}
                    <button class="btn-deselect-all" on:click={deselectAllTempOptions}>Auswahl aufheben</button>
                {/if}
            </div>
            <div class="footer-right">
                <button class="btn-cancel" on:click={closeFilterModal}>Abbrechen</button>
                <button class="btn-confirm" on:click={confirmFilterModal}>Bestätigen</button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Generelles Layout */
    .page-container { max-width: 1300px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif; color: #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; color: #1e293b; }
    .btn-primary { background: #0f172a; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .btn-primary:hover { background: #1e293b; }
    
    .top-bar { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; }
    .filter-left { display: flex; gap: 1rem; flex-wrap: wrap; flex: 1; }
    .filter-right { display: flex; width: 100%; max-width: 350px; }
    .dropdown-group, .search-box { display: flex; flex-direction: column; gap: 0.4rem; flex-grow: 1; }
    .dropdown-group { max-width: 250px; }
    label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    
    .search-mobile-wrapper { display: flex; gap: 0.5rem; width: 100%; }
    input[type="text"] { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }

    .btn-mobile-filter { display: none; align-items: center; gap: 0.4rem; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.6rem 1rem; border-radius: 4px; font-weight: 600; color: #334155; cursor: pointer; }
    .btn-mobile-filter:hover { background: #e2e8f0; }

    .content-wrapper { display: flex; gap: 2rem; align-items: flex-start; }
    .articles-section { flex: 2; }
    .results-info { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; }
    .article-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: transform 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .card-image { height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0; }
    .card-image img { width: 100%; height: 100%; object-fit: contain; padding: 1rem; box-sizing: border-box; }
    .no-image { color: #94a3b8; font-size: 0.9rem; }
    .card-content { padding: 1.2rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-title { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #1e293b; }
    .card-price { margin: 0 0 1.2rem 0; font-weight: 600; color: #0284c7; }
    .btn-details { margin-top: auto; text-align: center; padding: 0.6rem; background: #f1f5f9; color: #334155; text-decoration: none; border-radius: 4px; font-weight: 500; border: 1px solid #cbd5e1; }
    
    .no-results { grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f8fafc; border-radius: 8px; color: #64748b; }

    /* --- SIDEBAR --- */
    .sidebar-section { flex: 1; min-width: 300px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; position: sticky; top: 2rem; display: flex; flex-direction: column; overflow: hidden; }
    .sidebar-top { padding: 1.5rem 1.5rem 0 1.5rem; background: white; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .sidebar-header h3 { margin: 0; font-size: 1.1rem; }
    .sidebar-header-actions { display: flex; align-items: center; gap: 1rem; }
    .btn-close-sidebar { display: none; background: none; border: none; font-size: 1.8rem; line-height: 1; color: #64748b; cursor: pointer; padding: 0; }
    .btn-clear { background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer; font-weight: 500; padding: 0; }
    .sidebar-search { margin-bottom: 1.5rem; }
    .sidebar-search-input { width: 100%; padding: 0.5rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; }
    .sidebar-search-input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
    
    .sidebar-bottom { background: #f8fafc; padding: 1.5rem; border-top: 1px solid #e2e8f0; }
    .sidebar-filters-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .filter-group-title { margin: 0 0 0.5rem 0; font-size: 0.95rem; color: #334155; }
    .no-filters-text { font-size: 0.9rem; color: #64748b; margin: 0; }

    .btn-open-modal {
        display: flex; justify-content: space-between; align-items: center; width: 100%;
        background: white; border: 1px solid #cbd5e1; padding: 0.6rem; border-radius: 4px;
        font-size: 0.95rem; color: #334155; cursor: pointer; text-align: left; transition: all 0.2s;
    }
    .btn-open-modal:hover { border-color: #94a3b8; }
    .modal-btn-text { display: flex; align-items: center; gap: 0.5rem; }
    .badge { background: #3b82f6; color: white; padding: 0.1rem 0.4rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }

    /* --- RANGE SLIDER --- */
    .range-filter-wrapper { display: flex; flex-direction: column; gap: 0.8rem; }
    .range-inputs { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .range-separator { color: #94a3b8; font-weight: bold; }
    .input-with-unit { display: flex; align-items: center; background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding-right: 0.5rem; flex: 1; }
    .range-num-input { width: 100%; padding: 0.3rem 0.5rem; border: none; background: transparent; font-size: 0.9rem; text-align: right; outline: none; }
    .unit-label { font-size: 0.8rem; color: #64748b; margin-left: 0.2rem; font-weight: 500;}
    .dual-slider { position: relative; width: 100%; height: 24px; margin-bottom: 0.5rem; }
    .dual-slider::before { content: ""; position: absolute; width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; top: 50%; transform: translateY(-50%); z-index: 0; }
    .dual-slider input[type="range"] { position: absolute; width: 100%; pointer-events: none; -webkit-appearance: none; appearance: none; background: transparent; margin: 0; top: 50%; transform: translateY(-50%); }
    .dual-slider input[type="range"]::-webkit-slider-thumb { pointer-events: auto; -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; cursor: pointer; position: relative; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

    /* --- MODAL STYLING --- */
    .modal-fullscreen-backdrop {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 1000;
    }

    .modal-window {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; border-radius: 8px; width: 90%; max-width: 500px;
        max-height: 85vh; display: flex; flex-direction: column;
        z-index: 1001; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    .modal-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1.5rem; border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 { margin: 0; font-size: 1.25rem; color: #1e293b; }
    .btn-close-modal { background: none; border: none; font-size: 1.8rem; line-height: 1; color: #64748b; cursor: pointer; padding: 0; }

    .modal-search-area { padding: 1rem 1.5rem 0 1.5rem; }
    .modal-search-field {
        width: 100%; padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px;
        font-size: 0.95rem; background: #f8fafc;
    }
    .modal-search-field:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }

    .modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
    .modal-options-grid { display: flex; flex-direction: column; gap: 0.5rem; }

    .modal-option-card {
        display: flex; align-items: center; gap: 1rem; padding: 1rem;
        background: white; border: 1px solid #cbd5e1; border-radius: 6px;
        cursor: pointer; transition: all 0.2s ease;
    }
    .modal-option-card:hover { border-color: #94a3b8; background: #f8fafc; }
    .modal-option-card.selected { background: #eff6ff; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }

    .checkbox-indicator {
        width: 20px; height: 20px; border-radius: 4px; border: 1px solid #cbd5e1;
        display: flex; align-items: center; justify-content: center;
        background: white; transition: all 0.2s;
    }
    .modal-option-card.selected .checkbox-indicator { background: #3b82f6; border-color: #3b82f6; }

    .option-text { font-size: 1rem; color: #334155; font-weight: 500; }
    .modal-option-card.selected .option-text { color: #1e40af; }
    
    .no-modal-results { text-align: center; color: #64748b; font-size: 0.95rem; font-style: italic; margin-top: 1rem;}

    /* NEU: MODAL FOOTER LAYOUT FÜR "ALLE ABWÄHLEN" */
    .modal-footer {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1.2rem 1.5rem; border-top: 1px solid #e2e8f0; background: white;
        border-radius: 0 0 8px 8px;
    }

    .footer-left { flex-grow: 1; }
    .footer-right { display: flex; gap: 0.8rem; }

    .btn-deselect-all { 
        background: none; border: none; color: #ef4444; font-size: 0.9rem; font-weight: 500; 
        cursor: pointer; padding: 0.5rem 0; transition: color 0.2s; 
    }
    .btn-deselect-all:hover { color: #b91c1c; text-decoration: underline; }

    .btn-cancel { padding: 0.6rem 1.2rem; background: white; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; font-weight: 500; color: #475569; cursor: pointer; }
    .btn-cancel:hover { background: #f1f5f9; }
    .btn-confirm { padding: 0.6rem 1.5rem; background: #3b82f6; border: none; border-radius: 6px; font-size: 0.95rem; font-weight: 600; color: white; cursor: pointer; transition: background 0.2s;}
    .btn-confirm:hover { background: #2563eb; }

    .mobile-overlay { display: none; }

    @media (max-width: 900px) {
        .content-wrapper { flex-direction: column; }
        .filter-right { max-width: 100%; }
        .btn-mobile-filter { display: flex; }
        .mobile-overlay {
            display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 998;
        }
        .sidebar-section {
            position: fixed; top: 0; right: 0; bottom: 0; width: 85%; max-width: 400px;
            height: 100vh; margin: 0; border-radius: 0; z-index: 999;
            transform: translateX(100%); transition: transform 0.3s ease-in-out;
            box-shadow: -5px 0 25px rgba(0,0,0,0.1); overflow-y: auto;
        }
        .sidebar-section.is-open { transform: translateX(0); }
        .btn-close-sidebar { display: block; }
    }
</style>