<!-- src/lib/components/SearchableSelect.svelte -->
<script>
    export let options = []; 
    export let value = "";   
    export let name = "";    
    export let placeholder = "Bitte wählen oder suchen...";
    export let multiple = false; // NEU: Steuert den Multi-Select Modus

    // Initialisierung: Wenn multiple aktiv ist, muss value zwingend ein Array sein
    $: if (multiple && !Array.isArray(value)) {
        value = value ? [value] : [];
    }

    let searchTerm = "";
    let isOpen = false;

    // Reaktiv: Synchronisiert das Suchfeld
    $: {
        if (!isOpen) {
            if (multiple) {
                // Zeigt die gewählten Werte kommagetrennt an (z.B. "Rot, Blau")
                searchTerm = Array.isArray(value) && value.length > 0 ? value.join(', ') : "";
            } else {
                const selected = options.find(opt => opt.value === value);
                searchTerm = selected ? selected.label : "";
            }
        }
    }

    $: sortedOptions = [...options].sort((a, b) => 
        a.label.localeCompare(b.label, 'de', { sensitivity: 'base' })
    );

    // Reaktiv: Filtert die Optionen
    $: filteredOptions = sortedOptions.filter(opt => {
        if (multiple && !isOpen) return true; // Bei multiple nicht filtern, wenn geschlossen
        
        if (!multiple) {
            const currentSelected = options.find(o => o.value === value);
            if (currentSelected && searchTerm === currentSelected.label) return true;
        }
        return opt.label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    function selectOption(opt) {
        if (multiple) {
            // Hinzufügen oder Entfernen aus dem Array
            if (value.includes(opt.value)) {
                value = value.filter(v => v !== opt.value);
            } else {
                value = [...value, opt.value];
            }
            // WICHTIG: isOpen = false fehlt hier absichtlich, damit das Menü offen bleibt!
        } else {
            value = opt.value;
            searchTerm = opt.label;
            isOpen = false;
        }
    }

    function handleFocus(event) {
        isOpen = true;
        if (multiple) {
            searchTerm = ""; // Suchfeld leeren, damit man direkt filtern kann
        } else {
            event.target.select(); 
        }
    }

    function handleBlur() {
        setTimeout(() => { isOpen = false; }, 200);
    }
</script>

<div class="searchable-select">
    <!-- NEU: Generiert mehrere versteckte Inputs für den Server, wenn multiple=true -->
    {#if multiple}
        {#each value as val}
            <input type="hidden" {name} value={val} />
        {/each}
    {:else}
        <input type="hidden" {name} bind:value={value} />
    {/if}
    
    <input 
        type="text" 
        class="search-input"
        placeholder={placeholder}
        bind:value={searchTerm}
        on:focus={handleFocus}
        on:input={() => { isOpen = true; if(!multiple) value = ""; }}
        on:blur={handleBlur}
    />
    
    {#if isOpen}
        <ul class="dropdown-list">
            {#each filteredOptions as opt}
                <!-- on:mousedown|preventDefault verhindert, dass das Input den Fokus verliert und sich schließt -->
                <li 
                    on:mousedown|preventDefault 
                    on:click={() => selectOption(opt)}
                    class:selected={multiple && value.includes(opt.value)}
                >
                    <!-- Kleine Checkbox für besseres visuelles Feedback bei multiple -->
                    {#if multiple}
                        <input type="checkbox" checked={value.includes(opt.value)} tabindex="-1" style="pointer-events: none; margin-right: 8px;" />
                    {/if}
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
    /* Bisheriges Styling bleibt identisch */
    .searchable-select { position: relative; width: 100%; }
    .search-input { width: 100%; padding: 0.6rem; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 1rem; background-color: white; transition: border-color 0.2s, box-shadow 0.2s; }
    .search-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
    .dropdown-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #cbd5e1; border-radius: 4px; max-height: 250px; overflow-y: auto; z-index: 50; list-style: none; margin: 0; padding: 0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .dropdown-list li { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; display: flex; align-items: center;}
    .dropdown-list li:last-child { border-bottom: none; }
    .dropdown-list li:hover { background: #f1f5f9; color: #0f172a; }
    .dropdown-list li.selected { background: #eff6ff; font-weight: 500;} /* Leicht blauer Hintergrund für gewählte Items */
    .no-results { color: #94a3b8 !important; cursor: default !important; background: transparent !important; font-style: italic; }
</style>