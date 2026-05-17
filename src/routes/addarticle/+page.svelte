<script>
    import { onDestroy, tick, onMount } from 'svelte';
    import { enhance } from '$app/forms';
    import SearchableSelect from '$lib/components/SearchableSelect.svelte';
    import { page } from '$app/stores';
    
    import 'cropperjs/dist/cropper.css';
    import Cropper from 'cropperjs';
    
    export let data;
    export let form;
    
    const { categories, attributes } = data;

    // --- State Management ---
    let title = "";
    let description = "";
    let supplier = "";
    let price = "";
    let orderLink = "";
    let importUrl = "";
    let isExtracting = false;

    let selectedMainCategoryId = "";
    let selectedSubcategoryId = "";

    // Kategorien-Logik
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

    // --- REAKTIVER URL-IMPORT (Bookmarklet Empfang) ---
    $: {
        const urlParams = $page.url.searchParams;
        const urlTitle = urlParams.get('title');
        const urlSource = urlParams.get('url');
        const urlDesc = urlParams.get('desc');

        if (urlTitle && !title) title = decodeURIComponent(urlTitle);
        if (urlSource && !orderLink) {
            orderLink = decodeURIComponent(urlSource);
            importUrl = orderLink;
            
            const rawText = urlDesc ? decodeURIComponent(urlDesc) : "";
            if (rawText && !isExtracting) {
                handleEnhancedImport(rawText);
            }
        }
    }

    async function handleEnhancedImport(rawText) {
        if (isExtracting) return;
        isExtracting = true;
        try {
            const res = await fetch('/api/extract-article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    html: rawText, 
                    url: orderLink,
                    availableCategories: categories.map(c => ({id: c._id, name: c.name}))
                })
            });

            const result = await res.json();
            if (res.ok) {
                if (result.title) title = result.title;
                if (result.description) description = result.description;
                if (result.price) price = result.price;
                if (result.supplier) supplier = result.supplier;
                if (result.categoryId) selectedMainCategoryId = result.categoryId;
                
                if (result.specs) {
                    const specsString = Object.entries(result.specs)
                        .map(([k, v]) => `${k}: ${v}`).join('\n');
                    if (specsString) description += `\n\nSpezifikationen:\n${specsString}`;
                }
            }
        } catch (error) {
            console.error("KI Fehler:", error);
        } finally {
            isExtracting = false;
        }
    }

    // --- Bild-Handling ---
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
        const canvas = cropperInstance.getCroppedCanvas({ width: 1280, height: 720 });
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
        if (cropperInstance) cropperInstance.destroy();
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
        enctype="multipart/form-data" 
        use:enhance={({ formData }) => {
            if (croppedFileBlob) formData.set('image', croppedFileBlob, 'article.jpg');
        }}
    >
        <div class="form-section">
            <h2>Kategorisierung</h2>
            <div class="form-group">
                <span class="label-text">Hauptkategorie *</span>
                <SearchableSelect 
                    name="mainCategoryId" 
                    options={mainCategoryOptions} 
                    bind:value={selectedMainCategoryId} 
                    placeholder="Wählen..." 
                />
            </div>

            {#if subCategoryOptions.length > 0}
                <div class="form-group">
                    <span class="label-text">Unterkategorie</span>
                    <SearchableSelect 
                        name="subcategoryId" 
                        options={subCategoryOptions} 
                        bind:value={selectedSubcategoryId} 
                        placeholder="Wählen..." 
                    />
                </div>
            {/if}
        </div>

        <div class="form-section">
            <h2>Allgemeine Informationen</h2>
            <div class="form-group">
                <label for="title" class="label-text">Artikelbezeichnung *</label>
                <input type="text" id="title" name="title" bind:value={title} required />
            </div>

            <div class="form-group">
                <label for="description" class="label-text">Beschreibung *</label>
                <textarea id="description" name="description" bind:value={description} rows="6" required></textarea>
            </div>

            <div class="attributes-grid">
                <div class="form-group">
                    <label for="stock" class="label-text">Bestand *</label>
                    <input type="number" id="stock" name="stock" min="0" required />
                </div>
                <div class="form-group">
                    <label for="supplier" class="label-text">Lieferant</label>
                    <input type="text" id="supplier" name="supplier" bind:value={supplier} />
                </div>
                <div class="form-group">
                    <label for="price" class="label-text">Preis (CHF)</label>
                    <input type="number" id="price" name="price" step="0.01" bind:value={price} />
                </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label for="orderLink" class="label-text">Bestelllink</label>
                <input type="url" id="orderLink" name="orderLink" bind:value={orderLink} />
            </div>

            <div class="image-area">
                <span class="label-text">Artikelbild (16:9)</span>
                {#if !isCropping && !imagePreview}
                    <div class="file-upload-wrapper">
                        <input type="file" id="image" accept="image/*" bind:this={fileInputElement} on:change={handleImageSelect} />
                    </div>
                {/if}

                {#if isCropping}
                    <div class="cropper-container">
                        <div class="image-workspace">
                            <img bind:this={cropperImageEl} src={imagePreview} alt="Zuschneiden" />
                        </div>
                        <div class="cropper-actions">
                            <button type="button" class="btn-cancel" on:click={cancelCrop}>Abbrechen</button>
                            <button type="button" class="btn-apply" on:click={applyCrop}>Speichern</button>
                        </div>
                    </div>
                {/if}

                {#if imagePreview && !isCropping}
                    <div class="preview-wrap">
                        <img src={imagePreview} alt="Vorschau" class="final-preview" />
                        <button type="button" class="btn-remove" on:click={cancelCrop}>Bild entfernen</button>
                    </div>
                {/if}
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" class="btn-submit" disabled={isExtracting}>
                {isExtracting ? 'KI analysiert...' : 'Artikel in Datenbank speichern'}
            </button>
        </div>
    </form>
</div>

<style>
    .page-container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    h1 { color: #16a34a; margin-bottom: 2rem; font-size: 1.8rem; }
    h2 { font-size: 1.1rem; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
    .form-section { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 2rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.2rem; }
    .attributes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.2rem; }
    .label-text { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    input, textarea { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; width: 100%; box-sizing: border-box; }
    .image-area { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .image-workspace { max-height: 400px; background: #0f172a; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
    .image-workspace img { display: block; max-width: 100%; }
    .cropper-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .btn-apply { background: #16a34a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-cancel { background: #94a3b8; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .final-preview { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
    .btn-remove { display: block; margin-top: 0.5rem; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .btn-submit { background: #16a34a; color: white; padding: 1rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; font-size: 1rem; }
    .btn-submit:disabled { background: #94a3b8; cursor: not-allowed; }
    .alert { padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; font-weight: 600; }
    .success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
</style>