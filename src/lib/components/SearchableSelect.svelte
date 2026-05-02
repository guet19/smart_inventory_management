<!-- src/lib/components/SearchableSelect.svelte -->
<script>
    export let options = []; 
    export let value = "";   
    export let name = "";    
    export let placeholder = "Bitte wählen oder suchen...";

    let searchTerm = "";
    let isOpen = false;

    // Reaktiv: Synchronisiert das Suchfeld mit dem aktuell gewählten Wert
    $: {
        if (!isOpen) {
            const selected = options.find(opt => opt.value === value);
            searchTerm = selected ? selected.label : "";
        }
    }

    // Sortiert die Optionen einmalig alphabetisch
    $: sortedOptions = [...options].sort((a, b) => 
        a.label.localeCompare(b.label, 'de', { sensitivity: 'base' })
    );

    // NEU: Intelligenter Filter
    $: filteredOptions = sortedOptions.filter(opt => {
        // Prüfen, ob der Suchbegriff exakt dem Label des aktuell gewählten Wertes entspricht
        const currentSelected = options.find(o => o.value === value);
        
        if (currentSelected && searchTerm === currentSelected.label) {
            // Der Nutzer hat ins Feld geklickt, aber noch nichts Neues getippt -> Alle anzeigen!
            return true;
        }
        
        // Ansonsten ganz normal filtern
        return opt.label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    function selectOption(opt) {
        value = opt.value;
        searchTerm = opt.label;
        isOpen = false;
    }

    function handleBlur() {
        setTimeout(() => { isOpen = false; }, 200);
    }

    // NEU: Fokus-Handler, der den Text automatisch markiert
    function handleFocus(event) {
        isOpen = true;
        event.target.select(); 
    }
</script>

<div class="searchable-select">
    <input type="hidden" {name} bind:value={value} required />
    
    <input 
        type="text" 
        class="search-input"
        placeholder={placeholder}
        bind:value={searchTerm}
        on:focus={handleFocus}
        on:input={() => { isOpen = true; value = ""; }}
        on:blur={handleBlur}
    />
    
    {#if isOpen}
        <ul class="dropdown-list">
            {#each filteredOptions as opt}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                <li on:click={() => selectOption(opt)}>
                    {opt.label}
                </li>
            {/each}

            {#if filteredOptions.length === 0}
                <li class="no-results">Keine Treffer gefunden</li>
            {/if}
        </ul>
    {/if}
</div>

<style>
    .searchable-select {
        position: relative;
        width: 100%;
    }
    
    .search-input {
        width: 100%;
        padding: 0.6rem;
        box-sizing: border-box;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        font-size: 1rem;
        background-color: white;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    .dropdown-list {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        max-height: 250px;
        overflow-y: auto;
        z-index: 50;
        list-style: none;
        margin: 0;
        padding: 0;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .dropdown-list li {
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        font-size: 0.95rem;
    }
    
    .dropdown-list li:last-child {
        border-bottom: none;
    }
    
    .dropdown-list li:hover {
        background: #f1f5f9;
        color: #0f172a;
    }
    
    .no-results {
        color: #94a3b8 !important;
        cursor: default !important;
        background: transparent !important;
        font-style: italic;
    }
</style>