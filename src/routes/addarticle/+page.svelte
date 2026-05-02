<!-- src/routes/artikel-hinzufuegen/+page.svelte -->
<script>
    import SearchableSelect from '$lib/components/SearchableSelect.svelte';
    
    export let data;
    export let form;
    
    const { categories, attributes } = data;

    let selectedMainCategoryId = "";
    let selectedSubcategoryId = "";

    $: mainCategoryOptions = categories.map(cat => ({ 
        value: cat._id, 
        label: cat.name 
    }));
    
    $: selectedMainCategory = categories.find(cat => cat._id === selectedMainCategoryId) || null;
    $: availableSubcategories = selectedMainCategory ? selectedMainCategory.subcategories : [];
    
    $: subCategoryOptions = availableSubcategories.map(sub => ({ 
        value: sub.id, 
        label: sub.name 
    }));

    $: if (selectedMainCategoryId) {
        selectedSubcategoryId = "";
    }

    $: selectedSubcategory = availableSubcategories.find(sub => sub.id === selectedSubcategoryId) || null;

    $: activeAttributes = selectedSubcategory 
        ? attributes.filter(attr => selectedSubcategory.allowed_attributes.includes(attr._id))
        : [];
</script>

<div class="page-container">
    <h1>Neuen Artikel anlegen</h1>

    {#if form?.success}
        <div class="alert success">{form.message}</div>
    {/if}
    {#if form?.error}
        <div class="alert error">{form.error}</div>
    {/if}

    <form method="POST" class="article-form">
        
        <!-- 1. Kategorisierung GANZ OBEN -->
        <div class="form-section">
            <h2>Kategorisierung</h2>
            <div class="form-group">
                <label>Hauptkategorie *</label>
                <SearchableSelect 
                    name="mainCategoryId" 
                    options={mainCategoryOptions} 
                    bind:value={selectedMainCategoryId} 
                    placeholder="Hauptkategorie suchen oder wählen..." 
                />
            </div>

            {#if subCategoryOptions.length > 0}
                <div class="form-group">
                    <label>Unterkategorie *</label>
                    <SearchableSelect 
                        name="subcategoryId" 
                        options={subCategoryOptions} 
                        bind:value={selectedSubcategoryId} 
                        placeholder="Unterkategorie suchen oder wählen..." 
                    />
                </div>
            {/if}
        </div>

        <!-- 2. Allgemeine Informationen DARUNTER -->
        <div class="form-section">
            <h2>Allgemeine Informationen</h2>
            
            <div class="form-group">
                <label for="title">Artikelbezeichnung *</label>
                <input type="text" id="title" name="title" placeholder="z.B. iPhone 15 Pro" required />
            </div>

            <div class="form-group">
                <label for="description">Beschreibung *</label>
                <textarea id="description" name="description" rows="3" placeholder="Genaue Beschreibung des Artikels..." required></textarea>
            </div>

            <!-- Grid für die restlichen Standardwerte für ein kompakteres Layout -->
            <div class="attributes-grid">
                <div class="form-group">
                    <label for="stock">Bestand *</label>
                    <input type="number" id="stock" name="stock" min="0" placeholder="0" required />
                </div>

                <div class="form-group">
                    <label for="minStock">Mindestbestand</label>
                    <input type="number" id="minStock" name="minStock" min="0" placeholder="0" />
                </div>

                <div class="form-group">
                    <label for="supplier">Lieferant</label>
                    <input type="text" id="supplier" name="supplier" placeholder="Name der Firma" />
                </div>

                <div class="form-group">
                    <label for="price">Preis pro Stück (CHF)</label>
                    <input type="number" id="price" name="price" step="0.05" min="0" placeholder="0.00" />
                </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label for="orderLink">Bestellink</label>
                <input type="url" id="orderLink" name="orderLink" placeholder="https://..." />
            </div>
        </div>

        <!-- 3. Spezifikationen (Dynamisch) -->
        {#if activeAttributes.length > 0}
            <div class="form-section dynamic-attributes">
                <h2>Spezifikationen</h2>
                
                <div class="attributes-grid">
                    {#each activeAttributes as attr}
                        <div class="form-group">
                            <label>{attr.label}</label>
                            
                            {#if attr.options && attr.options.length > 0}
                                <SearchableSelect 
                                    name="attr_{attr._id}" 
                                    options={attr.options.map(opt => ({ value: opt, label: opt }))} 
                                    placeholder="{attr.label} suchen..." 
                                />
                            {:else}
                                <input 
                                    type="text" 
                                    name="attr_{attr._id}" 
                                    placeholder="{attr.label} eingeben..." 
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="form-actions">
            <button type="submit" class="btn-submit">Artikel in Datenbank speichern</button>
        </div>
    </form>
</div>

<style>
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, -apple-system, sans-serif;
    }

    h1 {
        margin-bottom: 2rem;
        color: #1e293b;
    }

    h2 {
        font-size: 1.25rem;
        margin-top: 0;
        margin-bottom: 1rem;
        color: #334155;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
    }

    .article-form {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .form-section {
        background: #ffffff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
    }

    .dynamic-attributes {
        background: #f8fafc;
        border-color: #cbd5e1;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .form-group:last-child {
        margin-bottom: 0;
    }

    .attributes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
    }

    label {
        font-weight: 500;
        color: #475569;
        font-size: 0.9rem;
    }

    input[type="text"],
    input[type="number"],
    input[type="url"],
    textarea {
        width: 100%;
        padding: 0.6rem;
        box-sizing: border-box;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s;
        font-family: inherit;
    }

    textarea {
        resize: vertical; /* Erlaubt dem Nutzer, das Feld in der Höhe zu verstellen */
    }

    input:focus,
    textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 1rem;
    }

    .btn-submit {
        padding: 0.75rem 1.5rem;
        background: #0f172a;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .btn-submit:hover {
        background: #1e293b;
    }

    .alert {
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-weight: 500;
    }
    
    .alert.success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
    }
    
    .alert.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
    }
</style>