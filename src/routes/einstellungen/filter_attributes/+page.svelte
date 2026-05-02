<script>
  import { enhance } from "$app/forms";
  let { data, form } = $props();

  // --- STATE: ÜBERSICHT (Erstellen & Liste) ---
  let label = $state("");
  let ui_type = $state("text");
  let unit = $state("");
  let currentOption = $state("");
  let optionsList = $state([]);
  let isMultiple = $state(false);

  let searchQuery = $state("");
  let expandedId = $state(null);
  let successMessage = $state("");

  // NEU: States für die Quick-Actions (Inline-Editing)
  let quickOptionSearchQuery = $state("");
  let quickNewOption = $state("");

  // --- STATE: FOCUS-MODUS (Bearbeiten) ---
  let activeAttributeId = $state(null);
  let editLabel = $state("");
  let editUiType = $state("text");
  let editUnit = $state("");
  let editCurrentOption = $state("");
  let editOptionsList = $state([]);
  let editIsMultiple = $state(false);
  let optionSearchQuery = $state("");

  // --- DATEN-LOGIK ---
  let sortedAttributes = $derived(
    [...(data.attributeLibrary || [])].sort((a, b) =>
      a.label.localeCompare(b.label, "de"),
    ),
  );

  let filteredAttributes = $derived(
    searchQuery.trim() === ""
      ? sortedAttributes
      : sortedAttributes.filter((attr) => {
          const query = searchQuery.toLowerCase().trim();
          const labelMatch = attr.label.toLowerCase().includes(query);
          const optionsMatch =
            attr.options &&
            attr.options.some((opt) => opt.toLowerCase().includes(query));
          return labelMatch || optionsMatch;
        }),
  );

  let activeAttribute = $derived(
    data.attributeLibrary?.find((a) => a._id === activeAttributeId),
  );
  let filteredEditOptions = $derived(
    optionSearchQuery.trim() === ""
      ? editOptionsList
      : editOptionsList.filter((opt) =>
          opt.toLowerCase().includes(optionSearchQuery.toLowerCase().trim()),
        ),
  );

  // --- FUNKTIONEN ---
  function toggleAttribute(id) {
    if (searchQuery.trim() !== "") return;
    expandedId = expandedId === id ? null : id;
    // Setzt die Quick-Suchfelder beim Wechseln zurück
    quickOptionSearchQuery = "";
    quickNewOption = "";
  }

  function addOption() {
    if (currentOption.trim() && !optionsList.includes(currentOption.trim())) {
      optionsList.push(currentOption.trim());
      currentOption = "";
    }
  }

  function removeOption(optValue) {
    optionsList = optionsList.filter((o) => o !== optValue);
  }

  function openEditMode(attr) {
    activeAttributeId = attr._id;
    editLabel = attr.label;
    editUiType = attr.ui_type;
    editUnit = attr.unit || "";
    editIsMultiple = attr.is_multiple || false;
    editOptionsList = [...(attr.options || [])];
    optionSearchQuery = "";
    successMessage = "";
    window.scrollTo(0, 0);
  }

  function closeEditMode() {
    activeAttributeId = null;
    optionSearchQuery = "";
  }

  function addEditOption() {
    if (
      editCurrentOption.trim() &&
      !editOptionsList.includes(editCurrentOption.trim())
    ) {
      editOptionsList.push(editCurrentOption.trim());
      editCurrentOption = "";
      optionSearchQuery = "";
    }
  }

  function removeEditOption(optValue) {
    editOptionsList = editOptionsList.filter((o) => o !== optValue);
  }
</script>

<div class="container mt-4 mb-5">
  <div
    class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3"
  >
    <h2>Filtermöglichkeiten verwalten</h2>
    {#if activeAttributeId}
      <button
        class="btn btn-outline-secondary shadow-sm fw-bold"
        onclick={closeEditMode}
      >
        <i class="bi bi-arrow-left me-1"></i> Zurück zur Übersicht
      </button>
    {/if}
  </div>

  {#if successMessage !== ""}
    <div
      class="alert alert-success shadow-sm animate-fade-in d-flex align-items-center gap-2 mb-4"
    >
      <i class="bi bi-check-circle-fill"></i>
      {successMessage}
    </div>
  {/if}

  <div class="row">
    <!-- ========================================== -->
    <!-- ANSICHT 1: FOCUS-MODUS (Bearbeiten)        -->
    <!-- ========================================== -->
    {#if activeAttribute}
      <div class="col-12 animate-fade-in">
        <div class="card shadow border-0 overflow-hidden">
          <div class="card-header bg-dark text-white p-4">
            <span class="text-secondary small text-uppercase fw-bold"
              >Filterattribut bearbeiten</span
            >
            <h3 class="h4 mb-0 mt-1 text-info">{activeAttribute.label}</h3>
          </div>

          <div class="card-body bg-light p-4">
            <form
              method="POST"
              action="?/update"
              use:enhance={() => {
                return async ({ result, update }) => {
                  await update();
                  if (result.type === "success") {
                    successMessage = `Attribut "${editLabel}" erfolgreich aktualisiert!`;
                    closeEditMode();
                    setTimeout(() => {
                      successMessage = "";
                    }, 3500);
                  }
                };
              }}
            >
              <input type="hidden" name="id" value={activeAttribute._id} />
              <div class="row mb-4">
                <div class="col-md-4 mb-3">
                  <label for="editLabel" class="form-label small fw-bold"
                    >Anzeigename</label
                  >
                  <input
                    type="text"
                    id="editLabel"
                    name="label"
                    class="form-control"
                    bind:value={editLabel}
                    required
                  />
                </div>
                <div class="col-md-4 mb-3">
                  <label for="editUiType" class="form-label small fw-bold"
                    >Eingabetyp</label
                  >
                  <select
                    id="editUiType"
                    name="ui_type"
                    class="form-select"
                    bind:value={editUiType}
                  >
                    <option value="text">Freitext</option>
                    <option value="number">Zahl</option>
                    <option value="select">Dropdown (Auswahl)</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="editUnit" class="form-label small fw-bold"
                    >Einheit</label
                  >
                  <input
                    type="text"
                    id="editUnit"
                    name="unit"
                    class="form-control"
                    bind:value={editUnit}
                  />
                </div>
              </div>

              {#if editUiType === "select"}
                <div class="bg-white border rounded shadow-sm p-4 mb-4">
                  <div
                    class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-3"
                  >
                    <h5 class="h6 text-muted mb-0 fw-bold">
                      Werte & Optionen verwalten
                    </h5>
                    <div class="form-check form-switch mb-0">
                      <input
                        type="hidden"
                        name="is_multiple"
                        value={editIsMultiple}
                      />
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="editIsMultipleSwitch"
                        bind:checked={editIsMultiple}
                      />
                      <label
                        class="form-check-label text-dark small"
                        for="editIsMultipleSwitch">Mehrfachauswahl</label
                      >
                    </div>
                  </div>

                  <div class="row align-items-center mb-4">
                    <div class="col-md-6 mb-2 mb-md-0">
                      <label class="form-label small text-muted"
                        >Suchen (Filtert die Liste unten)</label
                      >
                      <div class="input-group input-group-sm shadow-sm">
                        <span class="input-group-text bg-light"
                          ><i class="bi bi-search"></i></span
                        >
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Option suchen..."
                          bind:value={optionSearchQuery}
                        />
                        {#if optionSearchQuery !== ""}
                          <button
                            class="btn btn-outline-secondary bg-white"
                            type="button"
                            aria-label="Zurücksetzen"
                            onclick={() => (optionSearchQuery = "")}
                            ><i class="bi bi-x-lg"></i></button
                          >
                        {/if}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small text-muted"
                        >Neuen Wert hinzufügen</label
                      >
                      <div class="input-group input-group-sm shadow-sm">
                        <input
                          type="text"
                          class="form-control"
                          placeholder="z.B. M5"
                          bind:value={editCurrentOption}
                          onkeydown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addEditOption())}
                        />
                        <button
                          type="button"
                          class="btn btn-primary flex-shrink-0 px-3"
                          aria-label="Hinzufügen"
                          onclick={addEditOption}
                          ><i class="bi bi-plus-lg">Hinzufügen</i></button
                        >
                      </div>
                    </div>
                  </div>

                  <div
                    class="d-flex flex-wrap gap-2 p-3 bg-light rounded border"
                    style="min-height: 100px; max-height: 300px; overflow-y: auto;"
                  >
                    {#each filteredEditOptions as opt}
                      <span
                        class="badge bg-white text-dark border border-secondary-subtle fs-6 d-flex align-items-center gap-2 shadow-sm py-2 px-3"
                      >
                        {opt}
                        <button
                          type="button"
                          class="btn-close"
                          style="font-size: 0.6rem"
                          aria-label="Entfernen"
                          onclick={() => removeEditOption(opt)}
                        ></button>
                      </span>
                    {:else}
                      <div class="text-muted small w-100 text-center mt-3">
                        Keine Werte hinterlegt.
                      </div>
                    {/each}
                  </div>
                  <input
                    type="hidden"
                    name="options"
                    value={editOptionsList.join(",")}
                  />
                </div>
              {/if}

              <div
                class="d-flex justify-content-end gap-3 mt-4 pt-3 border-top"
              >
                <button
                  type="button"
                  class="btn btn-outline-secondary px-4"
                  onclick={closeEditMode}>Abbrechen</button
                >
                <button
                  type="submit"
                  class="btn btn-success px-5 fw-bold shadow-sm"
                >
                  <i class="bi bi-save me-2"></i> Änderungen speichern
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
        <div
          class="card shadow-sm border-0 bg-dark text-white p-4 sticky-top dark-scrollbar"
          style="top: 2rem; max-height: 85vh; overflow-y: auto;"
        >
          <h3 class="h5 mb-3">Neues Filter-Attribut</h3>

          <form
            method="POST"
            action="?/create"
            use:enhance={() => {
              return async ({ result, update }) => {
                await update();
                if (result.type === "success") {
                  successMessage = `Attribut "${label}" erfolgreich angelegt!`;
                  label = "";
                  unit = "";
                  optionsList = [];
                  isMultiple = false;
                  setTimeout(() => {
                    successMessage = "";
                  }, 3500);
                }
              };
            }}
          >
            <div class="mb-3">
              <label for="label" class="form-label small">Anzeigename</label>
              <input
                type="text"
                id="label"
                name="label"
                class="form-control bg-secondary text-white border-0"
                bind:value={label}
                required
              />
            </div>
            <div class="mb-3">
              <label for="ui_type" class="form-label small">Eingabetyp</label>
              <select
                id="ui_type"
                name="ui_type"
                class="form-select bg-secondary text-white border-0"
                bind:value={ui_type}
              >
                <option value="text">Freitext</option>
                <option value="number">Zahl</option>
                <option value="select">Dropdown</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="unit" class="form-label small"
                >Einheit (optional)</label
              >
              <input
                type="text"
                id="unit"
                name="unit"
                class="form-control bg-secondary text-white border-0"
                bind:value={unit}
              />
            </div>

            {#if ui_type === "select"}
              <div class="mb-4 p-3 bg-secondary rounded border border-dark">
                <div class="form-check form-switch">
                  <input type="hidden" name="is_multiple" value={isMultiple} />
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="isMultipleSwitch"
                    bind:checked={isMultiple}
                  />
                  <label
                    class="form-check-label text-white"
                    for="isMultipleSwitch">Mehrfachauswahl erlauben</label
                  >
                </div>
              </div>
              <div class="mb-3">
                <label for="optionInput" class="form-label small text-muted"
                  >Auswahl-Optionen</label
                >
                <div class="input-group mb-2">
                  <input
                    type="text"
                    id="optionInput"
                    class="form-control bg-secondary text-white border-0"
                    placeholder="z.B. M3"
                    bind:value={currentOption}
                    onkeydown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addOption())}
                  />
                  <button
                    type="button"
                    class="btn btn-primary flex-shrink-0 px-3"
                    aria-label="Hinzufügen"
                    onclick={addOption}><i class="bi bi-plus-lg"></i></button
                  >
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  {#each optionsList as opt}
                    <span
                      class="badge bg-primary d-flex align-items-center gap-2"
                    >
                      {opt}
                      <button
                        type="button"
                        class="btn-close btn-close-white"
                        style="font-size: 0.5rem"
                        aria-label="Entfernen"
                        onclick={() => removeOption(opt)}
                      ></button>
                    </span>
                  {/each}
                </div>
                <input
                  type="hidden"
                  name="options"
                  value={optionsList.join(",")}
                />
              </div>
            {/if}
            <button type="submit" class="btn btn-success w-100 mt-3 fw-bold"
              >Speichern</button
            >
          </form>
        </div>
      </div>

      <div class="col-md-8 animate-fade-in">
        <div
          class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3"
        >
          <h3 class="h5 mb-0">Vorhandene Filtermöglichkeiten</h3>
          <div class="input-group shadow-sm" style="max-width: 300px;">
            <span class="input-group-text bg-white border-end-0 text-muted"
              ><i class="bi bi-search"></i></span
            >
            <input
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Filter durchsuchen..."
              bind:value={searchQuery}
            />
            {#if searchQuery !== ""}
              <button
                class="btn btn-outline-secondary border-start-0 bg-white"
                type="button"
                aria-label="Zurücksetzen"
                onclick={() => (searchQuery = "")}
                ><i class="bi bi-x-lg"></i></button
              >
            {/if}
          </div>
        </div>

        <div class="list-group shadow-sm">
          {#each filteredAttributes as attr}
            <div
              class="list-group-item list-group-item-action p-0 overflow-hidden bg-white"
            >
              <button
                class="w-100 border-0 bg-transparent p-3 d-flex justify-content-between align-items-center text-start"
                onclick={() => toggleAttribute(attr._id)}
                aria-expanded={expandedId === attr._id ||
                  searchQuery.trim() !== ""}
              >
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-bold fs-5 text-dark">{attr.label}</span>
                  {#if attr.unit}
                    <span class="badge bg-light text-secondary border"
                      >Einheit: {attr.unit}</span
                    >
                  {/if}
                  <span
                    class="badge {attr.ui_type === 'select'
                      ? 'bg-info text-dark'
                      : 'bg-secondary'} rounded-pill ms-2"
                  >
                    {attr.ui_type === "select"
                      ? attr.is_multiple
                        ? "Multi-Dropdown"
                        : "Dropdown"
                      : attr.ui_type}
                  </span>
                </div>
                <i
                  class="bi {expandedId === attr._id ||
                  searchQuery.trim() !== ''
                    ? 'bi-chevron-up'
                    : 'bi-chevron-down'} text-dark"
                ></i>
              </button>

              <!-- ========================================================= -->
              <!-- NEU: DIE QUICK-ACTION ANSICHT FÜR AUSGEKLAPPTE ATTRIBUTE  -->
              <!-- ========================================================= -->
              {#if expandedId === attr._id || searchQuery.trim() !== ""}
                <div class="p-3 bg-light border-top animate-fade-in">
                  {#if attr.ui_type === "select"}
                    <!-- HEADER: Titel links, Suche oben rechts -->
                    <div
                      class="d-flex justify-content-between align-items-center mb-3"
                    >
                      <h6 class="text-muted small fw-bold mb-0 text-uppercase">
                        Hinterlegte Optionen
                      </h6>
                      <div
                        class="input-group input-group-sm shadow-sm"
                        style="width: 250px;"
                      >
                        <span class="input-group-text bg-white"
                          ><i class="bi bi-search"></i></span
                        >
                        <input
                          type="text"
                          class="form-control"
                          placeholder="{attr.label} durchsuchen..."
                          bind:value={quickOptionSearchQuery}
                        />
                      </div>
                    </div>

                    <!-- HIER IST DER FIX: @const ausserhalb des divs, direkt im {#if} -->
                    {@const filteredQuickOptions = (attr.options || []).filter(
                      (o) =>
                        o
                          .toLowerCase()
                          .includes(
                            quickOptionSearchQuery.toLowerCase().trim(),
                          ),
                    )}

                    <!-- GEFILTERTE LISTE MIT QUICK-DELETE (Jedes Badge ist ein kleines Formular) -->
                    <div class="d-flex flex-wrap gap-2">
                      {#each filteredQuickOptions as option}
                        <form
                          method="POST"
                          action="?/removeOptionQuick"
                          use:enhance={() => {
                            return async ({ update }) => {
                              await update();
                              successMessage = `Wert "${option}" entfernt!`;
                              setTimeout(() => {
                                successMessage = "";
                              }, 3000);
                            };
                          }}
                          class="m-0 p-0"
                        >
                          <input type="hidden" name="id" value={attr._id} />
                          <input type="hidden" name="option" value={option} />
                          <div
                            class="badge bg-white text-dark border border-secondary-subtle px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                          >
                            {option}
                            <!-- Klick auf das X sendet das Formular ab -->
                            <button
                              type="submit"
                              class="btn-close"
                              style="font-size: 0.6rem"
                              aria-label="Entfernen"
                            ></button>
                          </div>
                        </form>
                      {:else}
                        <p class="text-muted small fst-italic mb-0">
                          Keine passenden Werte gefunden.
                        </p>
                      {/each}
                    </div>
                  {:else}
                    <div class="alert alert-secondary py-2 mb-0 border-0">
                      <i class="bi bi-info-circle me-2"></i> Erlaubt freie {attr.ui_type ===
                      "number"
                        ? "Zahlenwerte"
                        : "Texteingaben"}.
                    </div>
                  {/if}

                  <!-- FOOTER: Hinzufügen (unten links) & Hauptaktionen (unten rechts) -->
                  <div
                    class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3"
                  >
                    {#if attr.ui_type === "select"}
                      <!-- QUICK-ADD UNTEN LINKS -->
                      <form
                        method="POST"
                        action="?/addOptionQuick"
                        use:enhance={() => {
                          return async ({ result, update }) => {
                            await update();
                            if (result.type === "success") {
                              successMessage = `Wert erfolgreich hinzugefügt!`;
                              quickNewOption = ""; // Feld für nächste Eingabe leeren
                              setTimeout(() => {
                                successMessage = "";
                              }, 3000);
                            }
                          };
                        }}
                        style="width: 250px;"
                      >
                        <input type="hidden" name="id" value={attr._id} />
                        <div class="input-group input-group-sm shadow-sm">
                          <input
                            type="text"
                            name="newOption"
                            class="form-control"
                            placeholder="Neuen Wert hinzufügen..."
                            bind:value={quickNewOption}
                            required
                          />
                          <button
                            type="submit"
                            class="btn btn-success fw-bold px-3"
                            ><i class="bi bi-plus-lg"> &#10004</i></button
                          >
                        </div>
                      </form>
                    {:else}
                      <div></div>
                      <!-- Leerer Platzhalter für Flexbox -->
                    {/if}

                    <!-- HAUPTAKTIONEN UNTEN RECHTS -->
                    <div class="d-flex gap-2">
                      <button
                        class="btn btn-sm btn-outline-primary fw-bold px-3 shadow-sm"
                        onclick={() => openEditMode(attr)}
                      >
                        <i class="bi bi-pencil me-1"></i> Alles bearbeiten
                      </button>

                      <form
                        method="POST"
                        action="?/delete"
                        use:enhance={() => {
                          // HIER IST DER FIX: Wir merken uns den Namen, BEVOR die Liste neu geladen wird
                          const deletedLabel = attr.label;

                          return async ({ result, update }) => {
                            await update(); // Hier rücken die restlichen Einträge nach

                            if (result.type === "success") {
                              // Wir nutzen jetzt unsere gemerkte Variable statt attr.label
                              successMessage = `Attribut "${deletedLabel}" erfolgreich gelöscht!`;
                              setTimeout(() => {
                                successMessage = "";
                              }, 3500);
                            }
                          };
                        }}
                        class="m-0 p-0"
                      >
                        <input type="hidden" name="id" value={attr._id} />
                        <button
                          type="submit"
                          class="btn btn-sm btn-outline-danger fw-bold px-3 shadow-sm"
                          onclick={(e) => {
                            if (
                              !confirm(
                                `Möchtest du das Attribut '${attr.label}' wirklich unwiderruflich löschen?`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <i class="bi bi-trash me-1"></i> Löschen
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .dark-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .dark-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .dark-scrollbar::-webkit-scrollbar-thumb {
    background-color: #495057;
    border-radius: 10px;
  }
  .dark-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #6c757d;
  }

  p {
    color: white;
  }
  h2 {
    color: #22c55e;
  }

  h3 {
    color: #22c55e;
  }
</style>
