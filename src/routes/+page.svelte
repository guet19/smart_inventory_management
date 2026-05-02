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

    // --- 3. DYNAMISCHE SIDEBAR-FILTER (Basierend auf DB-Schema) ---
    $: availableSidebarFilters = (() => {
        const attrMap = {}; 
        
        // Sammeln aller vorhandenen Werte der aktuell gefilterten Artikel
        baseFilteredArticles.forEach(article => {
            if (article.attributes) {
                for (const [attrId, value] of Object.entries(article.attributes)) {
                    if (value !== undefined && value !== "") {
                        if (!attrMap[attrId]) attrMap[attrId] = new Set();
                        attrMap[attrId].add(value);
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

                // WENN DAS DATENBANK-SCHEMA SAGT, ES IST EINE NUMMER:
                if (attrDef.ui_type === 'number') {
                    // Alle Werte in echte Zahlen umwandeln
                    const numValues = optionsArr
                        .map(v => parseFloat(String(v).replace(',', '.')))
                        .filter(v => !isNaN(v));

                    if (numValues.length > 0) {
                        const min = Math.min(...numValues);
                        const max = Math.max(...numValues);
                        
                        // Nur als Slider anzeigen, wenn es eine echte Spanne gibt
                        if (min < max) {
                            result.push({
                                id: attrId,
                                label: attrDef.label,
                                type: 'range',
                                absMin: min,
                                absMax: max,
                                unit: unitStr
                            });
                            continue; // Direkt zum nächsten Attribut
                        }
                    }
                }

                // WENN ES EIN SELECT IST (Oder eine Zahl mit nur einem einzigen vorkommenden Wert)
                result.push({
                    id: attrId,
                    label: attrDef.label,
                    type: 'checkbox',
                    // Die Sortierung mit { numeric: true } ordnet "2 mm" vor "10 mm" ein!
                    options: optionsArr.sort((a, b) => String(a).localeCompare(String(b), 'de', { sensitivity: 'base', numeric: true })),
                    unit: unitStr
                });
            }
        }
        return result.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
    })();

    // --- 4. DETAIL-FILTER STATES ---
    let selectedAttributeFilters = {}; // Für Checkboxen
    let activeRangeFilters = {};       // Für Range-Slider

    function toggleAttributeFilter(attrId, value, isChecked) {
        if (!selectedAttributeFilters[attrId]) selectedAttributeFilters[attrId] = [];
        if (isChecked) {
            selectedAttributeFilters[attrId] = [...selectedAttributeFilters[attrId], value];
        } else {
            selectedAttributeFilters[attrId] = selectedAttributeFilters[attrId].filter(v => v !== value);
        }
        selectedAttributeFilters = { ...selectedAttributeFilters };
    }

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
        // 1. Checkboxen prüfen
        for (const [attrId, selectedValues] of Object.entries(selectedAttributeFilters)) {
            if (selectedValues && selectedValues.length > 0) {
                if (!article.attributes || !selectedValues.includes(article.attributes[attrId])) return false; 
            }
        }

        // 2. Range-Slider prüfen
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
        <a href="/artikel-hinzufuegen" class="btn-primary">+ Neuer Artikel</a>
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
                <input type="text" id="search" bind:value={searchQuery} placeholder="Artikelname eingeben..." />
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
                            <a href={`/artikel/${article._id}`} class="btn-details">Details ansehen</a>
                        </div>
                    </div>
                {/each}
                {#if finalFilteredArticles.length === 0}
                    <div class="no-results">Es wurden keine Artikel gefunden.</div>
                {/if}
            </div>
        </div>

        <!-- RECHTE SEITE: Filter-Sidebar -->
        <div class="sidebar-section">
            <div class="sidebar-header">
                <h3>Spezifikationen</h3>
                {#if Object.values(selectedAttributeFilters).some(arr => arr.length > 0) || Object.keys(activeRangeFilters).length > 0}
                    <button class="btn-clear" on:click={clearAttributeFilters}>Filter löschen</button>
                {/if}
            </div>

            {#if availableSidebarFilters.length === 0}
                <p class="no-filters-text">Keine weiteren Filter verfügbar.</p>
            {:else}
                <div class="sidebar-filters-list">
                    {#each availableSidebarFilters as filter}
                        <div class="filter-group">
                            <h4 class="filter-group-title">{filter.label}</h4>
                            
                            <!-- CHECKBOXEN (Für ui_type: "select" oder "text") -->
                            {#if filter.type === 'checkbox'}
                                <div class="filter-options">
                                    {#each filter.options as opt}
                                        <label class="checkbox-label">
                                            <input 
                                                type="checkbox" 
                                                value={opt} 
                                                checked={selectedAttributeFilters[filter.id]?.includes(opt)}
                                                on:change={(e) => toggleAttributeFilter(filter.id, opt, e.target.checked)}
                                            />
                                            <!-- Anzeige des Wertes inkl. Einheit -->
                                            <span class="checkbox-text">{opt}{filter.unit}</span>
                                        </label>
                                    {/each}
                                </div>
                            
                            <!-- RANGE-SLIDER (Für ui_type: "number") -->
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

<style>
    /* Die bestehenden Styles bleiben identisch, ich ergänze nur das Styling für die Einheiten-Anzeige */
    .page-container { max-width: 1300px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif; color: #334155; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    h1 { margin: 0; color: #1e293b; }
    .btn-primary { background: #0f172a; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .btn-primary:hover { background: #1e293b; }
    
    .top-bar { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem; }
    .filter-left { display: flex; gap: 1rem; flex-wrap: wrap; flex: 1; }
    .filter-right { display: flex; width: 100%; max-width: 300px; }
    .dropdown-group, .search-box { display: flex; flex-direction: column; gap: 0.4rem; flex-grow: 1; }
    .dropdown-group { max-width: 250px; }
    label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    input[type="text"] { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 1rem; width: 100%; box-sizing: border-box; }

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

    .sidebar-section { flex: 1; background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; position: sticky; top: 2rem; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; }
    .sidebar-header h3 { margin: 0; font-size: 1.1rem; }
    .btn-clear { background: none; border: none; color: #ef4444; font-size: 0.85rem; cursor: pointer; font-weight: 500; }
    .sidebar-filters-list { display: flex; flex-direction: column; gap: 1.5rem; }
    .filter-group-title { margin: 0 0 0.8rem 0; font-size: 0.95rem; color: #334155; }
    .filter-options { display: flex; flex-direction: column; gap: 0.5rem; }
    .checkbox-label { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.9rem; color: #475569; cursor: pointer; }

    /* Angepasst für Einheiten */
    .range-filter-wrapper { display: flex; flex-direction: column; gap: 0.8rem; }
    .range-inputs { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .range-separator { color: #94a3b8; font-weight: bold; }
    .input-with-unit {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding-right: 0.5rem;
        flex: 1;
    }
    .range-num-input { 
        width: 100%; 
        padding: 0.3rem 0.5rem; 
        border: none; 
        background: transparent;
        font-size: 0.9rem; 
        text-align: right; 
        outline: none;
    }
    .unit-label { font-size: 0.8rem; color: #64748b; margin-left: 0.2rem; font-weight: 500;}
    
    .dual-slider { position: relative; width: 100%; height: 24px; margin-bottom: 0.5rem; }
    .dual-slider::before { content: ""; position: absolute; width: 100%; height: 4px; background: #e2e8f0; border-radius: 2px; top: 50%; transform: translateY(-50%); z-index: 0; }
    .dual-slider input[type="range"] { position: absolute; width: 100%; pointer-events: none; -webkit-appearance: none; appearance: none; background: transparent; margin: 0; top: 50%; transform: translateY(-50%); }
    .dual-slider input[type="range"]::-webkit-slider-thumb { pointer-events: auto; -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; cursor: pointer; position: relative; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

    @media (max-width: 900px) {
        .content-wrapper { flex-direction: column; }
        .sidebar-section { width: 100%; position: static; box-sizing: border-box; }
    }
</style>