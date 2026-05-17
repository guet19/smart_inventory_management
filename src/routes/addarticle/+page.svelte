<script>
    import { onDestroy, tick, onMount } from "svelte";
    import { browser } from "$app/environment";
    import { enhance } from "$app/forms";
    import SearchableSelect from "$lib/components/SearchableSelect.svelte";
    import { page } from "$app/stores";

    import "cropperjs/dist/cropper.css";
    import Cropper from "cropperjs";

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

    // Zwischenspeicher für den Text aus dem Bookmarklet
    let rawImportText = "";

    // NEU: Speichert das Bild aus dem Bookmarklet
    let importedImageUrl = "";

    // Objekt zum Speichern der dynamischen Attribut-Werte (KI-Mapping)
    let attributeValues = {};

    let selectedMainCategoryId = "";
    let selectedSubcategoryId = "";

    // Kategorien-Logik
    $: mainCategoryOptions = categories.map((cat) => ({
        value: cat._id,
        label: cat.name,
    }));
    $: selectedMainCategory =
        categories.find((cat) => cat._id === selectedMainCategoryId) || null;
    $: availableSubcategories = selectedMainCategory
        ? selectedMainCategory.subcategories
        : [];
    $: subCategoryOptions = availableSubcategories.map((sub) => ({
        value: sub.id,
        label: sub.name,
    }));

    // Reset der Unterkategorie & Attribute bei Wechsel der Hauptkategorie
    $: if (selectedMainCategoryId) {
        selectedSubcategoryId = "";
        attributeValues = {};
    }

    $: selectedSubcategory =
        availableSubcategories.find(
            (sub) => sub.id === selectedSubcategoryId,
        ) || null;

    // Die Attribute, die zur gewählten Unterkategorie gehören
    $: activeAttributes = selectedSubcategory
        ? attributes.filter((attr) =>
              selectedSubcategory.allowed_attributes.includes(attr._id),
          )
        : [];

    // --- REAKTIVER URL-IMPORT (Bookmarklet Empfang) ---
    $: {
        const urlParams = $page.url.searchParams;
        const urlTitle = urlParams.get("title");
        const urlSource = urlParams.get("url");
        const urlDesc = urlParams.get("desc");
        const urlImg = urlParams.get("img"); // Das Bild aus dem Lesezeichen lesen

        // searchParams.get() decodiert bereits automatisch!
        if (urlTitle && !title) title = urlTitle;
        if (urlSource && !orderLink) {
            orderLink = urlSource;
            importUrl = orderLink;
            // Text speichern für den manuellen KI-Trigger später
            rawImportText = urlDesc || "";
        }
        if (urlImg && !importedImageUrl) {
            importedImageUrl = urlImg; // Bild-Link speichern
        }
    }

    // --- MANUELLER KI-IMPORT ---
    async function handleEnhancedImport() {
        if (!selectedSubcategoryId) {
            if (browser)
                alert(
                    "Bitte wähle zuerst eine Haupt- und Unterkategorie, damit die KI weiß, welche Spezifikationen gesucht werden!",
                );
            return;
        }

        isExtracting = true;
        try {
            const res = await fetch("/api/extract-article", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    html: rawImportText || importUrl,
                    url: orderLink,
                    expectedAttributes: activeAttributes.map((a) => ({
                        id: a._id,
                        name: a.label,
                        options: a.options || [],
                    })),
                }),
            });

            const result = await res.json();
            if (res.ok) {
                if (result.title && !title) title = result.title;
                if (result.description) description = result.description;
                if (result.price) price = result.price;
                if (result.supplier) supplier = result.supplier;

                // Mappe die KI-Ergebnisse (IDs) direkt in das Formular-Objekt
                if (result.specs) {
                    attributeValues = { ...attributeValues, ...result.specs };
                }

                // --- Automatisches Bild priorisieren ---
                // Er nimmt zuerst das Bild vom Bookmarklet, ansonsten das von der KI
                const imageToLoad = importedImageUrl || result.finalImageUrl;

                if (imageToLoad && !imagePreview) {
                    await loadExternalImage(imageToLoad);
                }
            }
        } catch (error) {
            console.error("KI Fehler:", error);
            if (browser) alert("Fehler bei der KI-Analyse.");
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
            aspectRatio: 4 / 3,
            viewMode: 2,
            background: false,
            zoomable: false,
        });
    }

    // --- Externes Bild über deinen internen Proxy laden ---
    async function loadExternalImage(imageUrl) {
        try {
            // Wenn das Lesezeichen ein Base64 Bild gefunden hat, ignoriere den Proxy
            if (imageUrl.startsWith("data:image")) {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                processImageBlob(blob);
                return;
            }

            console.log("Lade Bild über internen Proxy:", imageUrl);
            // Ruft die neue src/routes/api/fetch-image/+server.js auf
            const proxyUrl = `/api/fetch-image?url=${encodeURIComponent(imageUrl)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) throw new Error("Interner Proxy fehlgeschlagen");

            const blob = await response.blob();
            processImageBlob(blob);
        } catch (error) {
            console.error("Konnte automatisches Bild nicht laden:", error);
            if (browser)
                alert(
                    "Das Produktbild wurde vom Shop blockiert. Bitte lade es manuell hoch.",
                );
        }
    }

    // Hilfsfunktion zum Verarbeiten des Blobs für den Cropper
    async function processImageBlob(blob) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        imagePreview = URL.createObjectURL(blob);
        isCropping = true;
        await tick();

        if (cropperInstance) cropperInstance.destroy();
        cropperInstance = new Cropper(cropperImageEl, {
            aspectRatio: 4 / 3,
            viewMode: 2,
            background: false,
            zoomable: false,
        });
    }

    function applyCrop() {
        if (!cropperInstance) return;
        const canvas = cropperInstance.getCroppedCanvas({
            width: 1280,
            height: 720,
        });
        canvas.toBlob(
            (blob) => {
                croppedFileBlob = blob;
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                imagePreview = URL.createObjectURL(blob);
                cropperInstance.destroy();
                cropperInstance = null;
                isCropping = false;
            },
            "image/jpeg",
            0.85,
        );
    }

    function cancelCrop() {
        if (cropperInstance) cropperInstance.destroy();
        isCropping = false;
        imagePreview = null;
        croppedFileBlob = null;
        if (fileInputElement) fileInputElement.value = "";
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
            if (croppedFileBlob)
                formData.set("image", croppedFileBlob, "article.jpg");
        }}
    >
        <div class="form-section">
            <h2>1. Kategorisierung festlegen</h2>
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
                    <span class="label-text">Unterkategorie *</span>
                    <SearchableSelect
                        name="subcategoryId"
                        options={subCategoryOptions}
                        bind:value={selectedSubcategoryId}
                        placeholder="Wählen..."
                    />
                </div>
            {/if}
        </div>

        {#if rawImportText || importUrl}
            <div class="ai-trigger-section">
                <p class="ai-hint">
                    Webseiten-Daten erkannt. Wähle eine Unterkategorie und
                    starte die KI-Analyse.
                </p>
                <button
                    type="button"
                    class="btn-ai"
                    on:click={handleEnhancedImport}
                    disabled={isExtracting || !selectedSubcategoryId}
                >
                    {isExtracting
                        ? "Analysiere Daten & Bilder..."
                        : "✨ KI: Produktdaten & Spezifikationen extrahieren"}
                </button>
            </div>
        {/if}

        <div class="form-section">
            <h2>Allgemeine Informationen</h2>
            <div class="form-group">
                <label for="title" class="label-text"
                    >Artikelbezeichnung *</label
                >
                <input
                    type="text"
                    id="title"
                    name="title"
                    bind:value={title}
                    required
                />
            </div>

            <div class="form-group">
                <label for="description" class="label-text"
                    >Beschreibung *</label
                >
                <textarea
                    id="description"
                    name="description"
                    bind:value={description}
                    rows="6"
                    required
                ></textarea>
            </div>

            <div class="attributes-grid">
                <div class="form-group">
                    <label for="stock" class="label-text">Bestand *</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        min="0"
                        required
                    />
                </div>
                <div class="form-group">
                    <label for="supplier" class="label-text">Lieferant</label>
                    <input
                        type="text"
                        id="supplier"
                        name="supplier"
                        bind:value={supplier}
                    />
                </div>
                <div class="form-group">
                    <label for="price" class="label-text">Preis (CHF)</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        step="0.01"
                        bind:value={price}
                    />
                </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
                <label for="orderLink" class="label-text">Bestelllink</label>
                <input
                    type="url"
                    id="orderLink"
                    name="orderLink"
                    bind:value={orderLink}
                />
            </div>

            <div class="image-area">
                <span class="label-text">Artikelbild (4:3)</span>

                {#if !isCropping && !imagePreview}
                    <div class="file-upload-wrapper" style="margin-top: 0.5rem;">
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            bind:this={fileInputElement}
                            on:change={handleImageSelect}
                        />
                    </div>
                {/if}

                {#if isCropping}
                    <div
                        class="crop-editor-box"
                        style="margin-top: 1rem; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px;"
                    >
                        <div class="image-workspace" style="margin-bottom: 1rem;">
                            <img
                                bind:this={cropperImageEl}
                                src={imagePreview}
                                alt="Zuschneiden"
                            />
                        </div>

                        <div class="cropper-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button
                                type="button"
                                class="btn-cancel"
                                on:click={cancelCrop}
                                style="color: white; font-weight: bold;"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                class="btn-apply"
                                on:click={applyCrop}
                                style="color: white; font-weight: bold;"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                {/if}

                {#if imagePreview && !isCropping}
                    <div class="preview-wrap" style="margin-top: 1rem;">
                        <img
                            src={imagePreview}
                            alt="Vorschau"
                            class="final-preview"
                        />

                        <button
                            type="button"
                            class="btn-remove"
                            on:click={cancelCrop}
                            style="font-weight: bold;"
                        >
                            Bild löschen
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        {#if activeAttributes.length > 0}
            <div class="form-section">
                <h2>Spezifikationen</h2>
                <div class="attributes-grid">
                    {#each activeAttributes as attr}
                        <div class="form-group">
                            <span class="label-text">{attr.label}</span>
                            {#if attr.ui_type === "select"}
                                <div>
                                    <SearchableSelect
                                        name="attr_{attr._id}"
                                        options={(attr.options || []).map(
                                            (o) => ({ value: o, label: o }),
                                        )}
                                        multiple={attr.is_multiple}
                                        bind:value={attributeValues[attr._id]}
                                    />
                                </div>
                            {:else}
                                <input
                                    type="text"
                                    id="attr_{attr._id}"
                                    name="attr_{attr._id}"
                                    bind:value={attributeValues[attr._id]}
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}

        <div class="form-actions">
            <button type="submit" class="btn-submit" disabled={isExtracting}>
                Artikel in Datenbank speichern
            </button>
        </div>
    </form>
</div>

<style>
    .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }
    h1 {
        color: #16a34a;
        margin-bottom: 2rem;
        font-size: 1.8rem;
    }
    h2 {
        font-size: 1.1rem;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.5rem;
        margin-bottom: 1.5rem;
    }
    .form-section {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        margin-bottom: 2rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
    }
    .attributes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.2rem;
    }

    /* KI Button Styling */
    .ai-trigger-section {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        text-align: center;
    }
    .ai-hint {
        color: #166534;
        font-size: 0.9rem;
        margin-top: 0;
        margin-bottom: 1rem;
        font-weight: 500;
    }
    .btn-ai {
        background: #22c55e;
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
    }
    .btn-ai:hover:not(:disabled) {
        background: #16a34a;
    }
    .btn-ai:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        opacity: 0.7;
    }

    .label-text {
        font-size: 0.85rem;
        font-weight: 600;
        color: #64748b;
    }
    input,
    textarea {
        padding: 0.6rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
    }
    .image-area {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f1f5f9;
    }
    .image-workspace {
        max-height: 400px;
        background: #0f172a;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 1rem;
    }
    .image-workspace img {
        display: block;
        max-width: 100%;
    }
    .cropper-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    .btn-apply {
        background: #16a34a;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
    .btn-cancel {
        background: #94a3b8;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }
    .final-preview {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    .btn-remove {
        display: block;
        margin-top: 0.5rem;
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fecaca;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
    }
    .btn-submit {
        background: #1e293b;
        color: white;
        padding: 1rem;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        width: 100%;
        font-size: 1rem;
    }
    .btn-submit:hover:not(:disabled) {
        background: #0f172a;
    }
    .btn-submit:disabled {
        background: #94a3b8;
        cursor: not-allowed;
    }
    .alert {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        text-align: center;
        font-weight: 600;
    }
    .success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
    }
    .error {
        background: #fee2e2;
        color: #b91c1c;
        border: 1px solid #fecaca;
    }
</style>
