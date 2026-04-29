<script>
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let label = $state("");
  let ui_type = $state("text");
  let unit = $state("");
  let currentOption = $state("");
  let optionsList = $state([]);
  // NEU: State für die Mehrfachauswahl
  let isMultiple = $state(false); 

  function addOption() {
      if (currentOption.trim() && !optionsList.includes(currentOption.trim())) {
          optionsList.push(currentOption.trim());
          currentOption = "";
      }
  }

  function removeOption(index) {
      optionsList.splice(index, 1);
  }

  let expandedId = $state(null);
  function toggleAttribute(id) {
      expandedId = expandedId === id ? null : id;
  }
</script>

<div class="container mt-4">
  <h1 class="mb-4">Attribut-Bibliothek verwalten</h1>
  
  <div class="row">
      <div class="col-md-5 mb-4">
          <div class="card shadow-sm border-0 bg-dark text-white p-4">
              <h3 class="h5 mb-4">Neues Filter-Attribut anlegen</h3>
              
              <form method="POST" action="?/create" use:enhance={() => {
                  return async ({ update }) => {
                      await update();
                      // NEU: Auch den Switch wieder zurücksetzen
                      label = ""; unit = ""; optionsList = []; isMultiple = false;
                  };
              }}>
                  <div class="mb-3">
                      <label for="label" class="form-label small">Anzeigename (z.B. Gewinde)</label>
                      <input type="text" id="label" name="label" class="form-control bg-secondary text-white border-0" bind:value={label} required>
                  </div>

                  <div class="mb-3">
                      <label for="ui_type" class="form-label small">Eingabetyp</label>
                      <select id="ui_type" name="ui_type" class="form-select bg-secondary text-white border-0" bind:value={ui_type}>
                          <option value="text">Freitext</option>
                          <option value="number">Zahl</option>
                          <option value="select">Dropdown (Auswahlliste)</option>
                      </select>
                  </div>

                  <div class="mb-3">
                      <label for="unit" class="form-label small ">Einheit (optional)</label>
                      <input type="text" id="unit" name="unit" class="form-control bg-secondary text-white border-0" bind:value={unit}>
                  </div>

                  {#if ui_type === 'select'}
                      <div class="mb-4 p-3 bg-secondary rounded border border-dark">
                          <div class="form-check form-switch">
                              <input type="hidden" name="is_multiple" value={isMultiple}>
                              <input class="form-check-input" type="checkbox" id="isMultipleSwitch" bind:checked={isMultiple}>
                              <label class="form-check-label text-white" for="isMultipleSwitch">
                                  Mehrfachauswahl erlauben
                              </label>
                          </div>
                          <small class="text-muted d-block mt-1">
                              {isMultiple ? 'Nutzer können mehrere Werte gleichzeitig wählen' : 'Nutzer können nur exakt einen Wert wählen.'}
                          </small>
                      </div>

                      <div class="mb-3">
                          <label for="optionInput" class="form-label small text-muted">Auswahl-Optionen (Werte)</label>
                          <div class="input-group mb-2">
                              <input type="text" id="optionInput" class="form-control bg-secondary text-white border-0" 
                                     placeholder="z.B. M3" bind:value={currentOption}
                                     onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}>
                              <button type="button" class="btn btn-primary" aria-label="Hinzufügen" onclick={addOption}>+</button>
                          </div>
                          
                          <div class="d-flex flex-wrap gap-2 mt-2">
                              {#each optionsList as opt, i}
                                  <span class="badge bg-primary d-flex align-items-center gap-2">
                                      {opt}
                                      <button type="button" class="btn-close btn-close-white" style="font-size: 0.5rem" aria-label="Option entfernen" onclick={() => removeOption(i)}></button>
                                  </span>
                              {/each}
                          </div>
                          <input type="hidden" name="options" value={optionsList.join(',')}>
                      </div>
                  {/if}

                  <button type="submit" class="btn btn-success w-100 mt-3 fw-bold">Attribut speichern</button>
                  
                  {#if form?.error}
                      <p class="text-danger small mt-2">{form.error}</p>
                  {/if}
              </form>
          </div>
      </div>

      <div class="col-md-7">
          <h3 class="h5 mb-4">Vorhandene Bibliothek</h3>
          
          <div class="list-group shadow-sm">
              {#each data.attributeLibrary as attr}
                  <div class="list-group-item list-group-item-action p-0 overflow-hidden">
                      <button 
                          class="w-100 border-0 bg-transparent p-3 d-flex justify-content-between align-items-center text-start"
                          onclick={() => toggleAttribute(attr._id)}
                      >
                          <div>
                              <span class="fw-bold text-primary">{attr.label}</span>
                              <span class="badge bg-light text-dark ms-2 border">{attr.ui_type}</span>
                              {#if attr.ui_type === 'select' && attr.is_multiple}
                                  <span class="badge bg-info text-dark ms-1">Multi</span>
                              {/if}
                          </div>
                          <i class="bi {expandedId === attr._id ? 'bi-chevron-up' : 'bi-chevron-down'}"></i>
                      </button>

                      {#if expandedId === attr._id}
                          <div class="p-3 bg-light border-top animate-fade-in">
                              <div class="row">
                                  <div class="col-md-4">
                                      <p class="small text-muted mb-1">Eingabetyp:</p>
                                      <strong>{attr.ui_type === 'select' ? 'Dropdown (Auswahl)' : 'Freitext / Zahl'}</strong>
                                      {#if attr.ui_type === 'select'}
                                          <div class="mt-2 small text-secondary">
                                              <i class="bi {attr.is_multiple ? 'bi-check-all' : 'bi-check-circle'}"></i> 
                                              {attr.is_multiple ? 'Mehrfachauswahl' : 'Einzelauswahl'}
                                          </div>
                                      {/if}
                                  </div>
                                  
                                  {#if attr.options && attr.options.length > 0}
                                      <div class="col-md-8">
                                          <p class="small text-muted mb-1">Erlaubte Werte (Optionen):</p>
                                          <div class="d-flex flex-wrap gap-1">
                                              {#each attr.options as option}
                                                  <span class="badge bg-white text-primary border border-primary-subtle">
                                                      {option}
                                                  </span>
                                              {/each}
                                          </div>
                                      </div>
                                  {/if}
                              </div>
                              
                              <div class="mt-3 pt-3 border-top d-flex gap-2">
                                  <button class="btn btn-sm btn-outline-secondary">Bearbeiten</button>
                                  <button class="btn btn-sm btn-outline-danger">Löschen</button>
                              </div>
                          </div>
                      {/if}
                  </div>
              {/each}
          </div>

          {#if data.attributeLibrary.length === 0}
              <div class="alert alert-info mt-3">
                  Keine Attribute in der Bibliothek gefunden.
              </div>
          {/if}
      </div>
  </div>
</div>

<style>
  .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
  }

  label {
    color: white;
}

h3{
  color: #22C55E;
}

</style>