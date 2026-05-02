<!-- src/routes/[id]/+page.svelte -->
<script>
    export let data;
    const { article, categories, attributes } = data;

    // --- 1. Kategorienamen auflösen ---
    const mainCategory = categories.find(c => c._id === article.mainCategoryId);
    const mainCategoryName = mainCategory ? mainCategory.name : 'Unbekannte Kategorie';
    
    let subCategoryName = "";
    if (mainCategory && article.subcategoryId) {
        const subCat = mainCategory.subcategories.find(s => s.id === article.subcategoryId);
        if (subCat) subCategoryName = subCat.name;
    }

    // --- 2. Spezifikationen auflösen und formatieren ---
    let displayAttributes = [];
    if (article.attributes) {
        for (const [attrId, value] of Object.entries(article.attributes)) {
            const attrDef = attributes.find(a => a._id === attrId);
            
            if (attrDef && value !== undefined && value !== "") {
                // Wenn es ein Multi-Select-Array ist (z.B. ["Rot", "Blau"]), verbinden wir es mit Kommas
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                
                displayAttributes.push({
                    label: attrDef.label,
                    value: displayValue,
                    unit: attrDef.unit ? ` ${attrDef.unit.trim()}` : ''
                });
            }
        }
        // Alphabetisch nach dem Labelnamen sortieren
        displayAttributes.sort((a, b) => a.label.localeCompare(b.label, 'de', { sensitivity: 'base' }));
    }
</script>

<div class="page-container">
    
    <!-- Breadcrumb-Navigation -->
    <nav class="breadcrumb">
        <a href="/">Übersicht</a> 
        <span class="separator">/</span>
        <span class="cat">{mainCategoryName}</span>
        {#if subCategoryName}
            <span class="separator">/</span>
            <span class="cat">{subCategoryName}</span>
        {/if}
    </nav>

    <div class="article-layout">
        
        <!-- LINKE SEITE: Bild -->
        <div class="image-section">
            {#if article.imagePath}
                <img src={article.imagePath} alt={article.title} class="main-image" />
            {:else}
                <div class="no-image-placeholder">
                    <span>Kein Artikelbild vorhanden</span>
                </div>
            {/if}
        </div>

        <!-- RECHTE SEITE: Infos & Specs -->
        <div class="info-section">
            <h1 class="title">{article.title}</h1>
            
            <div class="price-stock-box">
                {#if article.price}
                    <div class="price">CHF {article.price.toFixed(2)}</div>
                {/if}
                
                <div class="stock-info" class:low-stock={article.minStock && article.stock <= article.minStock} class:out-of-stock={article.stock === 0}>
                    <span class="indicator"></span>
                    {#if article.stock === 0}
                        Nicht auf Lager
                    {:else}
                        {article.stock} Stück auf Lager
                    {/if}
                </div>
            </div>

            <div class="description">
                <h3>Beschreibung</h3>
                <p>{article.description}</p>
            </div>

            <!-- Meta-Daten (Lieferant, etc.) -->
            <div class="meta-grid">
                {#if article.supplier}
                    <div class="meta-item">
                        <span class="meta-label">Lieferant</span>
                        <span class="meta-value">{article.supplier}</span>
                    </div>
                {/if}
                <div class="meta-item">
                    <span class="meta-label">Artikel-ID</span>
                    <span class="meta-value id-text">{article._id}</span>
                </div>
            </div>

            <!-- Externe Bestellung -->
            {#if article.orderLink}
                <div class="actions">
                    <a href={article.orderLink} target="_blank" rel="noopener noreferrer" class="btn-order">
                        Beim Lieferanten nachbestellen
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            {/if}

            <!-- Spezifikationen Tabelle -->
            {#if displayAttributes.length > 0}
                <div class="specs-section">
                    <h3>Spezifikationen</h3>
                    <table class="specs-table">
                        <tbody>
                            {#each displayAttributes as attr}
                                <tr>
                                    <td class="spec-label">{attr.label}</td>
                                    <td class="spec-value">{attr.value}{attr.unit}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

        </div>
    </div>
</div>

<style>
    .page-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, -apple-system, sans-serif;
        color: #334155;
    }

    /* Breadcrumbs */
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        margin-bottom: 2rem;
        color: #64748b;
    }
    .breadcrumb a {
        color: #3b82f6;
        text-decoration: none;
    }
    .breadcrumb a:hover {
        text-decoration: underline;
    }
    .separator { color: #cbd5e1; }
    .cat { font-weight: 500; color: #475569; }

    /* Layout */
    .article-layout {
        display: flex;
        gap: 3rem;
        align-items: flex-start;
    }

    /* Linke Seite (Bild) */
    .image-section {
        flex: 1;
        position: sticky;
        top: 2rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .main-image {
        max-width: 100%;
        max-height: 500px;
        object-fit: contain;
    }
    .no-image-placeholder {
        color: #94a3b8;
        font-size: 1.1rem;
        font-style: italic;
    }

    /* Rechte Seite (Infos) */
    .info-section {
        flex: 1.5;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .title {
        margin: 0;
        font-size: 2.2rem;
        color: #0f172a;
        line-height: 1.2;
    }

    .price-stock-box {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .price {
        font-size: 1.8rem;
        font-weight: 700;
        color: #0284c7;
    }

    .stock-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        color: #16a34a; /* Grün für guten Bestand */
        background: #f0fdf4;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        border: 1px solid #bbf7d0;
    }
    .indicator {
        width: 10px; height: 10px; border-radius: 50%; background: #22c55e;
    }

    /* Varianten für den Bestand */
    .stock-info.low-stock {
        color: #d97706; background: #fffbeb; border-color: #fde68a;
    }
    .stock-info.low-stock .indicator { background: #f59e0b; }
    
    .stock-info.out-of-stock {
        color: #dc2626; background: #fef2f2; border-color: #fecaca;
    }
    .stock-info.out-of-stock .indicator { background: #ef4444; }

    .description h3, .specs-section h3 {
        font-size: 1.2rem;
        color: #1e293b;
        margin: 0 0 1rem 0;
    }
    .description p {
        line-height: 1.6;
        color: #475569;
        margin: 0;
        white-space: pre-wrap; /* Behält Zeilenumbrüche aus der Textarea bei */
    }

    /* Meta Grid */
    .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    .meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    .meta-label {
        font-size: 0.85rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
    }
    .meta-value {
        font-weight: 500;
        color: #1e293b;
    }
    .id-text {
        font-family: monospace;
        color: #94a3b8;
        font-size: 0.9rem;
    }

    /* Button */
    .btn-order {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        color: #3b82f6;
        border: 1px solid #3b82f6;
        padding: 0.8rem 1.5rem;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;
    }
    .btn-order:hover {
        background: #eff6ff;
    }

    /* Spezifikationen Tabelle */
    .specs-table {
        width: 100%;
        border-collapse: collapse;
    }
    .specs-table tr:nth-child(odd) {
        background: #f8fafc;
    }
    .specs-table td {
        padding: 0.8rem 1rem;
        border-bottom: 1px solid #e2e8f0;
    }
    .specs-table tr:last-child td {
        border-bottom: none;
    }
    .spec-label {
        width: 40%;
        color: #64748b;
        font-weight: 500;
    }
    .spec-value {
        color: #1e293b;
        font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 900px) {
        .article-layout {
            flex-direction: column;
        }
        .image-section {
            position: static;
            width: 100%;
            box-sizing: border-box;
            min-height: 300px;
        }
    }
</style>