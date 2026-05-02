<script>
    import { enhance } from '$app/forms';
    let { data, form } = $props();

    // Svelte-Action für den Fokus (a11y-freundlicher Ersatz für 'autofocus')
    function focus(node) {
        node.focus();
    }

    // State für Formulare & Suche (Übersicht)
    let newMainName = $state("");
    let newSubName = $state("");
    let searchQuery = $state("");
    let expandedId = $state(null);

    // State für den "Focus-Modus" (Attribut-Zuweisung)
    let activeMainId = $state(null);
    let activeSubId = $state(null);
    let attributeSearchQuery = $state("");
    
    let successMessage = $state(""); 

    // State für das Umbenennen der Hauptkategorie (Inline-Editing)
    let editingMainId = $state(null);
    let editMainName = $state("");

    // --- DATEN-LOGIK: ÜBERSICHT ---
    let sortedCategories = $derived(
        [...(data.categories || [])].sort((a, b) => a.name.localeCompare(b.name, 'de'))
    );

    let filteredCategories = $derived(
        searchQuery.trim() === "" 
            ? sortedCategories 
            : sortedCategories.reduce((acc, cat) => {
                const query = searchQuery.toLowerCase().trim();
                const mainMatches = cat.name.toLowerCase().includes(query);
                const matchingSubs = (cat.subcategories || []).filter(sub => 
                    sub.name.toLowerCase().includes(query)
                );

                if (mainMatches) {
                    acc.push(cat);
                } else if (matchingSubs.length > 0) {
                    acc.push({ ...cat, subcategories: matchingSubs });
                }
                return acc;
            }, [])
    );

    // --- FUNKTIONEN ---
    function toggleCategory(id) {
        if (searchQuery.trim() !== '') return; 
        expandedId = expandedId === id ? null : id;
        newSubName = ""; 
    }

    function startEditMain(category) {
        editingMainId = category._id;
        editMainName = category.name;
    }

    function cancelEditMain() {
        editingMainId = null;
        editMainName = "";
    }

    // --- DATEN-LOGIK: FOCUS-MODUS (Attribute bearbeiten) ---
    let activeCategory = $derived(data.categories?.find(c => c._id === activeMainId));
    let activeSubcategory = $derived(activeCategory?.subcategories?.find(s => s.id === activeSubId));

    let filteredAttributes = $derived(
        (data.filterAttributes || [])
            .filter(attr => attr.label.toLowerCase().includes(attributeSearchQuery.toLowerCase().trim()))
            .sort((a, b) => a.label.localeCompare(b.label, 'de'))
    );

    function openAttributeEdit(mainId, subId) {
        activeMainId = mainId;
        activeSubId = subId;
        attributeSearchQuery = "";
        successMessage = "";
        window.scrollTo(0, 0); 
    }

    function closeAttributeEdit() {
        activeMainId = null;
        activeSubId = null;
    }
</script>

<div class="container mt-4 mb-5">
    
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2>Kategorien verwalten</h2>
        
        {#if activeMainId && activeSubId}
            <button class="btn btn-outline-secondary shadow-sm fw-bold" onclick={closeAttributeEdit}>
                <i class="bi bi-arrow-left me-1"></i> Zurück zur Übersicht
            </button>
        {/if}
    </div>

    {#if successMessage !== ""}
        <div class="alert alert-success shadow-sm animate-fade-in d-flex align-items-center gap-2 mb-4">
            <i class="bi bi-check-circle-fill"></i> {successMessage}
        </div>
    {/if}
    
    <div class="row">
        
        <!-- ========================================== -->
        <!-- ANSICHT 1: FOCUS-MODUS (Attribut-Zuweisung) -->
        <!-- ========================================== -->
        {#if activeCategory && activeSubcategory}
            <div class="col-12 animate-fade-in">
                <div class="card shadow border-0 overflow-hidden">
                    <div class="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-secondary small text-uppercase fw-bold">Filterattribute zuweisen</span>
                            <h3 class="h4 mb-0 mt-1 d-flex align-items-center gap-2">
                                <span class="text-muted">{activeCategory.name}</span> 
                                <i class="bi bi-chevron-right text-secondary" style="font-size: 1rem;"></i> 
                                <span class="text-info">{activeSubcategory.name}</span>
                            </h3>
                        </div>
                        <div class="badge bg-secondary fs-6 rounded-pill">
                            {activeSubcategory.allowed_attributes?.length || 0} Attribute aktiv
                        </div>
                    </div>

                    <div class="card-body bg-light p-4">
                        <form method="POST" action="?/updateAttributes" use:enhance={() => {
                            return async ({ result, update }) => {
                                await update();
                                if (result.type === 'success') {
                                    successMessage = `Attribute für "${activeSubcategory.name}" erfolgreich gespeichert!`;
                                    closeAttributeEdit(); 
                                    setTimeout(() => { successMessage = ""; }, 3500);
                                }
                            };
                        }}>
                            <input type="hidden" name="mainId" value={activeCategory._id}>
                            <input type="hidden" name="subId" value={activeSubcategory.id}>
                            
                            <div class="input-group mb-4 shadow-sm">
                                <span class="input-group-text bg-white border-end-0 py-3"><i class="bi bi-search text-muted"></i></span>
                                <input type="text" class="form-control border-start-0 py-3 fs-5" placeholder="Spezifisches Attribut suchen (z.B. Gewinde, Material)..." bind:value={attributeSearchQuery}>
                                {#if attributeSearchQuery !== ""}
                                    <button class="btn btn-white border border-start-0 bg-white" type="button" aria-label="Suche zurücksetzen" onclick={() => attributeSearchQuery = ""}>
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                {/if}
                            </div>

                            <div class="bg-white border rounded shadow-sm p-4 mb-4">
                                <h5 class="h6 text-muted mb-3 border-bottom pb-2">
                                    {attributeSearchQuery === "" ? "Alle verfügbaren Attribute:" : "Suchergebnisse:"}
                                </h5>
                                
                                <div class="row g-3">
                                    {#each filteredAttributes as attr}
                                        <div class="col-md-6 col-lg-4">
                                            <div class="form-check p-3 border rounded h-100 d-flex align-items-center form-check-custom">
                                                <input 
                                                    class="form-check-input ms-0 me-3 mt-0 flex-shrink-0" 
                                                    style="width: 1.5em; height: 1.5em; cursor: pointer;"
                                                    type="checkbox" 
                                                    name="attributes" 
                                                    value={attr._id} 
                                                    id="attr-{attr._id}"
                                                    checked={activeSubcategory.allowed_attributes?.includes(attr._id)}
                                                >
                                                <label class="form-check-label w-100 d-flex flex-column" style="cursor: pointer;" for="attr-{attr._id}">
                                                    <span class="fw-bold fs-6 text-dark">{attr.label}</span>
                                                    <span class="text-secondary" style="font-size: 0.75rem;">
                                                        Typ: {attr.ui_type === 'select' ? (attr.is_multiple ? 'Multi-Dropdown' : 'Dropdown') : attr.ui_type}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    {:else}
                                        <div class="col-12">
                                            <div class="alert alert-warning mb-0">Keine Attribute gefunden.</div>
                                        </div>
                                    {/each}
                                </div>
                            </div>

                            <div class="d-flex justify-content-end gap-3">
                                <button type="button" class="btn btn-outline-secondary px-4" onclick={closeAttributeEdit}>Abbrechen</button>
                                <button type="submit" class="btn btn-success px-5 fw-bold shadow-sm">
                                    <i class="bi bi-save me-2"></i> Zuweisung speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        <!-- ========================================== -->
        <!-- ANSICHT 2: ÜBERSICHT (Kategorien-Baum)     -->
        <!-- ========================================== -->
        {:else}
            <div class="col-md-4 mb-4 animate-fade-in">
                <div class="card shadow-sm border-0 bg-dark text-white p-4 sticky-top" style="top: 2rem;">
                    <h3 class="h5 mb-3">Neue Hauptkategorie erstellen</h3>
                    <form method="POST" action="?/createMain" use:enhance={() => { return async ({ update }) => { await update(); newMainName = ""; }; }}>
                        <div class="mb-3">
                            <label for="mainName" class="form-label small ">Bezeichnung</label>
                            <input type="text" id="mainName" name="name" class="form-control bg-secondary text-white border-0" bind:value={newMainName} required>
                        </div>
                        <button type="submit" class="btn btn-success w-100 fw-bold">Hauptkategorie anlegen</button>
                    </form>
                </div>
            </div>

            <div class="col-md-8 animate-fade-in">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h3 class="h5 mb-0">Kategorien-Struktur</h3>
                    <div class="input-group shadow-sm" style="max-width: 300px;">
                        <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control border-start-0 ps-0" placeholder="Kategorien suchen..." bind:value={searchQuery}>
                        {#if searchQuery !== ""}
                            <button class="btn btn-outline-secondary border-start-0 bg-white" type="button" aria-label="Suche zurücksetzen" onclick={() => searchQuery = ""}><i class="bi bi-x-lg"></i></button>
                        {/if}
                    </div>
                </div>
                
                <div class="list-group shadow-sm">
                    {#each filteredCategories as category}
                        <div class="list-group-item p-0 overflow-hidden bg-white">
                            
                            <div class="w-100 p-3 d-flex justify-content-between align-items-center">
                                {#if editingMainId === category._id}
                                    <!-- BEARBEITUNGS-MODUS (mit use:focus und aria-label für Abbrechen) -->
                                    <form method="POST" action="?/renameMain" class="w-100 d-flex gap-2 m-0" use:enhance={() => {
                                        return async ({ result, update }) => {
                                            await update();
                                            if (result.type === 'success') {
                                                successMessage = `Kategorie erfolgreich umbenannt!`;
                                                editingMainId = null;
                                                setTimeout(() => { successMessage = ""; }, 3000);
                                            }
                                        };
                                    }}>
                                        <input type="hidden" name="id" value={category._id}>
                                        <input type="text" name="newName" class="form-control form-control-sm" bind:value={editMainName} required use:focus>
                                        <button type="submit" class="btn btn-sm btn-success flex-shrink-0"><i class="bi bi-check-lg"></i> Speichern</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" aria-label="Abbrechen" onclick={cancelEditMain}><i class="bi bi-x-lg"></i></button>
                                    </form>
                                {:else}
                                    <!-- NORMALER MODUS -->
                                    <div class="d-flex align-items-center gap-2 flex-grow-1" style="cursor: pointer;" onclick={() => toggleCategory(category._id)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && toggleCategory(category._id)}>
                                        <span class="fw-bold fs-5 text-dark">{category.name}</span>
                                        <span class="badge bg-secondary rounded-pill">{category.subcategories?.length || 0}</span>
                                    </div>
                                    
                                    <div class="d-flex align-items-center gap-1">
                                        <button type="button" class="btn btn-sm btn-outline-secondary border-0" aria-label="Umbenennen" onclick={() => startEditMain(category)}>
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary border-0" aria-label="Auf/Zuklappen" onclick={() => toggleCategory(category._id)}>
                                            <i class="bi {expandedId === category._id || searchQuery.trim() !== '' ? 'bi-chevron-up' : 'bi-chevron-down'} text-dark"></i>
                                        </button>
                                    </div>
                                {/if}
                            </div>

                            {#if expandedId === category._id || searchQuery.trim() !== ''}
                                <div class="p-3 bg-light border-top">
                                    <h6 class="text-muted small fw-bold mb-3 text-uppercase">Unterkategorien</h6>
                                    
                                    {#if category.subcategories && category.subcategories.length > 0}
                                        {@const sortedSubs = [...category.subcategories].sort((a, b) => a.name.localeCompare(b.name, 'de'))}
                                        
                                        <div class="d-flex flex-column gap-2 mb-4">
                                            {#each sortedSubs as sub}
                                                <div class="bg-white text-dark border rounded px-3 py-3 shadow-sm d-flex justify-content-between align-items-center">
                                                    <div class="d-flex flex-column">
                                                        <span class="fw-bold fs-6">{sub.name}</span>
                                                        <small class="text-muted"><i class="bi bi-funnel me-1"></i> {sub.allowed_attributes?.length || 0} Filter zugewiesen</small>
                                                    </div>
                                                    <div>
                                                        <button type="button" class="btn btn-outline-primary fw-bold px-3 me-3 shadow-sm" onclick={() => openAttributeEdit(category._id, sub.id)}>
                                                            <i class="bi bi-sliders me-1"></i> Filter bearbeiten
                                                        </button>
                                                        <button type="button" class="btn-close" style="font-size: 0.7rem;" aria-label="Löschen"></button>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <p class="text-muted small fst-italic mb-4">Noch keine Unterkategorien vorhanden.</p>
                                    {/if}

                                    {#if searchQuery.trim() === ''}
                                        <div class="bg-white p-3 rounded border border-secondary-subtle">
                                            <label for="subName-{category._id}" class="form-label small fw-bold text-dark">Neue Unterkategorie in "{category.name}" hinzufügen</label>
                                            <form method="POST" action="?/createSub" use:enhance={() => { return async ({ update }) => { await update(); newSubName = ""; }; }}>
                                                <input type="hidden" name="mainId" value={category._id}>
                                                <div class="input-group">
                                                    <input type="text" id="subName-{category._id}" name="subName" class="form-control" placeholder="z.B. Schrauben..." bind:value={newSubName} required>
                                                    <button class="btn btn-primary px-4 fw-bold" type="submit"><i class="bi bi-plus-lg me-1"></i> Hinzufügen</button>
                                                </div>
                                            </form>
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
                {#if filteredCategories.length === 0}
                    <div class="alert alert-info mt-4">Keine Kategorien gefunden.</div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .form-check-custom { transition: all 0.2s ease-in-out; }
    .form-check-custom:hover { background-color: #f8f9fa; border-color: #0d6efd !important; }
    label { color: white; }
    h2, h3 { color: #22C55E; }
</style>