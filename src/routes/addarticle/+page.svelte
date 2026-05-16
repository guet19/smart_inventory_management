<script>
    import { onDestroy, tick } from 'svelte';
    import { enhance } from '$app/forms';
    import SearchableSelect from '$lib/components/SearchableSelect.svelte';
    
    import 'cropperjs/dist/cropper.css';
    import Cropper from 'cropperjs';
    
    export let data;
    export let form;
    
    const { categories, attributes } = data;

    // --- Kategorien-State ---
    let selectedMainCategoryId = "";
    let selectedSubcategoryId = "";

    $: mainCategoryOptions = categories.map(cat => ({ value: cat._id, label: cat.name }));
    $: selectedMainCategory = categories.find(cat => cat._id === selectedMainCategoryId) || null;
    $: availableSubcategories = selectedMainCategory ? selectedMainCategory.subcategories : [];
    $: subCategoryOptions = availableSubcategories.map(sub => ({ value: sub.id, label: sub.name }));

    $: if (selectedMainCategoryId) {
        selectedSubcategoryId = "";
    }

    $: selectedSubcategory = availableSubcategories.find(sub => sub.id === selectedSubcategoryId) || null;
    $: activeAttributes = selectedSubcategory 
        ? attributes.filter(attr => selectedSubcategory.allowed_attributes.includes(attr._id))
        : [];

    // --- Bild- und Cropper-State ---
    let fileInputElement;
    let imagePreview = null;     
    let isCropping = false;      
    let cropperImageEl;          
    let cropperInstance = null;
    let croppedFileBlob = null;  

    async function handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (imagePreview) URL.revokeObjectURL(imagePreview);

        imagePreview = URL.createObjectURL(file);
        isCropping = true;

        await tick();

        if (cropperInstance) cropperInstance.destroy();
        cropperInstance = new Cropper(cropperImageEl, {
            aspectRatio: 16 / 9, 
            viewMode: 2,         
            background: false,   
            zoomable: false      
        });
    }

    function applyCrop() {
        if (!cropperInstance) return;

        const canvas = cropperInstance.getCroppedCanvas({
            width: 1280, 
            height: 720
        });

        canvas.toBlob((blob) => {
            croppedFileBlob = blob;

            if (imagePreview) URL.revokeObjectURL(imagePreview);
            imagePreview = URL.createObjectURL(blob);

            cropperInstance.destroy();
            cropperInstance = null;
            isCropping = false;
        }, 'image/jpeg', 0.85); 
    }

    function cancelCrop() {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        isCropping = false;
        imagePreview = null;
        croppedFileBlob = null;
        if (fileInputElement) fileInputElement.value = '';
    }

    onDestroy(() => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        if (cropperInstance) cropperInstance.destroy();
    });
</script>

<div class="page-container">
    <h1>Neuen Artikel anlegen</h1>

    {#if form?.success}
        <div class="alert success">{form.message}</div>
    {/if}
    {#if form?.error}
        <div class="alert error">{form.error}</div>
    {/if}

    <form 
        method="POST" 
        class="article-form" 
        accept-charset="UTF-8" 
        enctype="multipart/form-data" 
        use:enhance={({ formData }) => {
            if (croppedFileBlob) {
                formData.set('image', croppedFileBlob, 'cropped_article_image.jpg');
            }
        }}
    >
        
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

        <div class="form-section">
            <h2>Allgemeine Informationen</h2>
            
            <div class="form-group">
                <label for="title">Artikelbezeichnung *</label>
                <input type="text" id="title" name="title" placeholder="z.B. Widerstand 10kOhm" required />
            </div>

            <div class="form-group">
                <label for="description">Beschreibung *</label>
                <textarea id="description" name="description" rows="3" placeholder="Genaue Beschreibung des Artikels..." required></textarea>
            </div>

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

            <div class="form-group" style="margin-top: 2rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem;">
                <label for="image">Artikelbild</label>
                
                {#if !isCropping && !imagePreview}
                    <div>
                        <input 
                            type="file" 
                            id="image"
                            name="image" 
                            accept="image/png, image/jpeg, image/webp" 
                            bind:this={fileInputElement}
                            on:change={handleImageSelect}
                        />
                    </div>
                {/if}

                {#if isCropping}
                    <div class="cropper-container">
                        <p class="cropper-instruction">Wähle den gewünschten Bildausschnitt (16:9)</p>
                        <div class="image-workspace">
                            <img bind:this={cropperImageEl} src={imagePreview} alt="Zuschneiden" />
                        </div>
                        <div class="cropper-actions">
                            <button type="button" class="btn-cancel" on:click={cancelCrop}>Abbrechen</button>
                            <button type="button" class="btn-apply" on:click={applyCrop}>Ausschnitt speichern</button>
                        </div>
                    </div>
                {/if}

                {#if imagePreview && !isCropping}
                    <div class="image-preview-container">
                        <img src={imagePreview} alt="Finale Vorschau" class="image-preview final" />
                        <div class="preview-actions">
                            <button type="button" class="btn-remove-image" on:click={cancelCrop}>
                                Bild löschen / Anderes wählen
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        {#if activeAttributes.length > 0}
            <div class="form-section dynamic-attributes">
                <h2>Spezifikationen</h2>
                
                <div class="attributes-grid">
                    {#each activeAttributes as attr}
                        <div class="form-group">
                            <label for="attr_{attr._id}">{attr.label}</label>
                            
                            {#if attr.ui_type === 'select'}
                                <SearchableSelect 
                                    name="attr_{attr._id}" 
                                    options={(attr.options || []).map(opt => ({ value: opt, label: opt }))} 
                                    placeholder="{attr.label} wählen..." 
                                    multiple={attr.is_multiple} 
                                />
                            {:else if attr.ui_type === 'number'}
                                <div class="input-with-unit">
                                    <input 
                                        type="number" 
                                        id="attr_{attr._id}"
                                        name="attr_{attr._id}" 
                                        step="any" 
                                        placeholder="Zahl eingeben..." 
                                        class="number-input"
                                    />
                                    {#if attr.unit}
                                        <span class="unit-label">{attr.unit}</span>
                                    {/if}
                                </div>
                            {:else}
                                <input 
                                    type="text" 
                                    id="attr_{attr._id}"
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

    h1 { margin-bottom: 2rem; color: #22C55E; }
    h2 { font-size: 1.25rem; margin-top: 0; margin-bottom: 1rem; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }

    .article-form { display: flex; flex-direction: column; gap: 2rem; }
    .form-section { background: #ffffff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .dynamic-attributes { background: #f8fafc; border-color: #cbd5e1; }

    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .form-group:last-child { margin-bottom: 0; }
    .attributes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }

    label { font-weight: 500; color: #475569; font-size: 0.9rem; }

    input[type="text"], input[type="number"], input[type="url"], textarea {
        width: 100%; padding: 0.6rem; box-sizing: border-box; border: 1px solid #cbd5e1;
        border-radius: 4px; font-size: 1rem; transition: border-color 0.2s; font-family: inherit;
    }
    textarea { resize: vertical; }
    input:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }

    .input-with-unit {
        display: flex; align-items: center; background: white; border: 1px solid #cbd5e1;
        border-radius: 4px; padding-right: 0.8rem; transition: border-color 0.2s;
    }
    .input-with-unit:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
    .number-input { flex: 1; border: none !important; box-shadow: none !important; margin: 0; }
    .number-input:focus { outline: none; }
    .unit-label { color: #64748b; font-weight: 500; font-size: 0.9rem; margin-left: 0.5rem; user-select: none; }

    /* Cropper & Image Preview Styling */
    .image-preview-container {
        margin-top: 0.8rem; display: flex; align-items: center; gap: 1.5rem; padding: 1rem;
        border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc;
    }
    
    .image-preview.final {
        max-width: 300px;
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 4px; 
        border: 1px solid #e2e8f0; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .cropper-container {
        margin-top: 1rem; padding: 1.5rem; background: #f8fafc;
        border: 1px solid #cbd5e1; border-radius: 8px;
    }
    .cropper-instruction { margin-top: 0; margin-bottom: 1rem; font-weight: 500; color: #334155; }
    .image-workspace {
        max-height: 500px; overflow: hidden; margin-bottom: 1rem;
        border-radius: 4px; background-color: #000;
    }
    .image-workspace img { display: block; max-width: 100%; }
    
    /* Angepasste Button-Styles */
    .cropper-actions { display: flex; gap: 1rem; justify-content: flex-end; }
    
    .btn-apply { 
        padding: 0.6rem 1.2rem; 
        background-color: #22C55E !important; 
        color: #ffffff !important; 
        border: none; 
        border-radius: 4px; 
        font-weight: 600; 
        font-size: 1rem;
        cursor: pointer; 
    }
    .btn-apply:hover { background-color: #16a34a !important; }
    
    .btn-cancel { 
        padding: 0.6rem 1.2rem; 
        background-color: #f1f5f9 !important; 
        color: #334155 !important; 
        border: 1px solid #cbd5e1; 
        border-radius: 4px; 
        font-weight: 600; 
        font-size: 1rem;
        cursor: pointer; 
    }
    .btn-cancel:hover { background-color: #e2e8f0 !important; }

    .preview-actions { display: flex; align-items: center; }
    .btn-remove-image {
        padding: 0.6rem 1.2rem; 
        background-color: #fee2e2 !important; 
        color: #991b1b !important; 
        border: 1px solid #fecaca;
        border-radius: 4px; 
        font-size: 0.9rem; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.2s;
    }
    .btn-remove-image:hover { background-color: #fca5a5 !important; }

    /* Buttons & Alerts */
    .form-actions { display: flex; justify-content: flex-end; margin-top: 1rem; }
    .btn-submit { padding: 0.75rem 1.5rem; background: #0f172a; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s; }
    .btn-submit:hover { background: #1e293b; }

    .alert { padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem; font-weight: 500; }
    .alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
</style>