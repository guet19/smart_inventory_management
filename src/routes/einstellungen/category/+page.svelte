<script>
  import { enhance } from "$app/forms";
  let { data, form } = $props();

  // State für Formulare & Suche
  let newMainName = $state("");
  let newSubName = $state("");
  let searchQuery = $state("");

  // State für Accordions
  let expandedId = $state(null);
  let activeSubcategoryId = $state(null); // Speichert, bei welcher Unterkategorie gerade die Attribute bearbeitet werden
  let attributeSearchQuery = $state(""); // NEU: Eigene Suche für die Attribut-Zuweisung

  // Sortierung der Hauptkategorien
  let sortedCategories = $derived(
    [...(data.categories || [])].sort((a, b) =>
      a.name.localeCompare(b.name, "de"),
    ),
  );

  // Suche für Haupt- und Unterkategorien
  let filteredCategories = $derived(
    searchQuery.trim() === ""
      ? sortedCategories
      : sortedCategories.reduce((acc, cat) => {
          const query = searchQuery.toLowerCase().trim();
          const mainMatches = cat.name.toLowerCase().includes(query);
          const matchingSubs = (cat.subcategories || []).filter((sub) =>
            sub.name.toLowerCase().includes(query),
          );

          if (mainMatches) {
            acc.push(cat);
          } else if (matchingSubs.length > 0) {
            acc.push({ ...cat, subcategories: matchingSubs });
          }
          return acc;
        }, []),
  );

  // NEU: Live-Suche für die auswählbaren Attribute
  let filteredAttributes = $derived(
    (data.filterAttributes || [])
      .filter((attr) =>
        attr.label
          .toLowerCase()
          .includes(attributeSearchQuery.toLowerCase().trim()),
      )
      .sort((a, b) => a.label.localeCompare(b.label, "de")),
  );

  function toggleCategory(id) {
    if (searchQuery.trim() !== "") return;
    expandedId = expandedId === id ? null : id;
    newSubName = "";
    activeSubcategoryId = null; // Schliesst den Attribut-Editor beim Wechsel
  }

  function toggleAttributeEdit(subId) {
    activeSubcategoryId = activeSubcategoryId === subId ? null : subId;
    attributeSearchQuery = ""; // Suchfeld für Attribute leeren
  }
</script>

<div class="container mt-4">
  <h2 class="mb-4">Kategorien verwalten</h2>

  <div class="row">
    <!-- LINKE SPALTE: Hauptkategorie erstellen (Bleibt gleich) -->
    <div class="col-md-4 mb-4">
      <div class="card shadow-sm border-0 bg-dark text-white p-4">
        <h3 class="h5 mb-3">Neue Hauptkategorie</h3>
        <p class="small text-muted mb-4">Erstelle hier die oberste Ebene.</p>
        <form
          method="POST"
          action="?/createMain"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              newMainName = "";
            };
          }}
        >
          <div class="mb-3">
            <label for="mainName" class="form-label small text-muted"
              >Name der Hauptkategorie</label
            >
            <input
              type="text"
              id="mainName"
              name="name"
              class="form-control bg-secondary text-white border-0"
              bind:value={newMainName}
              required
            />
          </div>
          <button type="submit" class="btn btn-success w-100 fw-bold"
            >Hauptkategorie anlegen</button
          >
          {#if form?.errorMain}
            <p class="text-danger small mt-2">{form.errorMain}</p>
          {/if}
        </form>
      </div>
    </div>

    <!-- RECHTE SPALTE: Kategorien-Baum -->
    <div class="col-md-8">
      <div
        class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3"
      >
        <h3 class="h5 mb-0">Kategorien-Struktur</h3>
        <div class="input-group shadow-sm" style="max-width: 300px;">
          <span class="input-group-text bg-white border-end-0 text-muted"
            ><i class="bi bi-search"></i></span
          >
          <input
            type="text"
            class="form-control border-start-0 ps-0"
            placeholder="Kategorien suchen..."
            bind:value={searchQuery}
          />
          {#if searchQuery !== ""}
            <button
              class="btn btn-outline-secondary border-start-0 bg-white"
              type="button"
              aria-label="Suche zurücksetzen"
              onclick={() => (searchQuery = "")}
              ><i class="bi bi-x-lg"></i></button
            >
          {/if}
        </div>
      </div>

      <div class="list-group shadow-sm">
        {#each filteredCategories as category}
          <div
            class="list-group-item list-group-item-action p-0 overflow-hidden bg-white"
          >
            <!-- Header Hauptkategorie -->
            <button
              class="w-100 border-0 bg-transparent p-3 d-flex justify-content-between align-items-center text-start"
              onclick={() => toggleCategory(category._id)}
              aria-expanded={expandedId === category._id ||
                searchQuery.trim() !== ""}
            >
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold fs-5 text-dark">{category.name}</span>
                <span class="badge bg-secondary rounded-pill"
                  >{category.subcategories?.length || 0}</span
                >
              </div>
              <i
                class="bi {expandedId === category._id ||
                searchQuery.trim() !== ''
                  ? 'bi-chevron-up'
                  : 'bi-chevron-down'} text-dark"
              ></i>
            </button>

            <!-- Unterkategorien & Attribut-Zuweisung -->
            {#if expandedId === category._id || searchQuery.trim() !== ""}
              <div class="p-3 bg-light border-top animate-fade-in">
                <h6 class="text-muted small fw-bold mb-3 text-uppercase">
                  Unterkategorien
                </h6>

                {#if category.subcategories && category.subcategories.length > 0}
                  {@const sortedSubs = [...category.subcategories].sort(
                    (a, b) => a.name.localeCompare(b.name, "de"),
                  )}

                  <div class="d-flex flex-column gap-2 mb-4">
                    {#each sortedSubs as sub}
                      <div
                        class="bg-white text-dark border rounded px-3 py-2 shadow-sm"
                      >
                        <div
                          class="d-flex justify-content-between align-items-center"
                        >
                          <div class="d-flex flex-column">
                            <span class="fw-medium fs-6">{sub.name}</span>
                            <small class="text-muted"
                              >{sub.allowed_attributes?.length || 0} Filter zugewiesen</small
                            >
                          </div>
                          <div>
                            <!-- NEU: Button zum Öffnen der Attribut-Verwaltung -->
                            <button
                              type="button"
                              class="btn btn-sm {activeSubcategoryId === sub.id
                                ? 'btn-primary'
                                : 'btn-outline-secondary'} me-2"
                              onclick={() => toggleAttributeEdit(sub.id)}
                            >
                              <i class="bi bi-sliders"></i> Attribute
                            </button>
                            <button
                              type="button"
                              class="btn-close"
                              style="font-size: 0.7rem;"
                              aria-label="Löschen"
                            ></button>
                          </div>
                        </div>

                        <!-- NEU: Aufklappbereich für die Attribut-Zuweisung -->
                        {#if activeSubcategoryId === sub.id}
                          <div class="mt-3 pt-3 border-top animate-fade-in">
                            <form
                              method="POST"
                              action="?/updateAttributes"
                              use:enhance
                            >
                              <input
                                type="hidden"
                                name="mainId"
                                value={category._id}
                              />
                              <input
                                type="hidden"
                                name="subId"
                                value={sub.id}
                              />

                              <!-- Attribut Suche & Manuelle Auswahl -->
                              <div class="input-group input-group-sm mb-3">
                                <span class="input-group-text bg-white"
                                  ><i class="bi bi-search"></i></span
                                >
                                <input
                                  type="text"
                                  class="form-control"
                                  placeholder="Attribut suchen (z.B. Gewinde)..."
                                  bind:value={attributeSearchQuery}
                                />
                                <!-- Ein X-Button zum schnellen Leeren, falls man wieder manuell scrollen will -->
                                {#if attributeSearchQuery !== ""}
                                  <button
                                    class="btn btn-outline-secondary bg-white border-start-0"
                                    type="button"
                                    aria-label="Suche zurücksetzen"
                                    onclick={() => (attributeSearchQuery = "")}
                                  >
                                    <i class="bi bi-x-lg"></i>
                                  </button>
                                {/if}
                              </div>

                              <!-- Checkbox-Liste der Attribute (Optimiert für manuelles Durchsuchen) -->
                              <div
                                class="bg-white border rounded shadow-sm mb-3"
                              >
                                <!-- Überschrift passt sich dynamisch an -->
                                <div class="p-2 border-bottom bg-light">
                                  <small class="text-muted fw-bold">
                                    {attributeSearchQuery === ""
                                      ? "Alle Attribute manuell durchsuchen:"
                                      : "Suchergebnisse:"}
                                  </small>
                                </div>

                                <!-- Die scrollbare Liste -->
                                <div
                                  class="p-2"
                                  style="max-height: 250px; overflow-y: auto;"
                                >
                                  {#each filteredAttributes as attr}
                                    <div class="form-check mb-2 p-1">
                                      <input
                                        class="form-check-input"
                                        type="checkbox"
                                        name="attributes"
                                        value={attr._id}
                                        id="attr-{sub.id}-{attr._id}"
                                        checked={sub.allowed_attributes?.includes(
                                          attr._id,
                                        )}
                                      />
                                      <label
                                        class="form-check-label d-flex align-items-center justify-content-between w-100"
                                        style="cursor: pointer;"
                                        for="attr-{sub.id}-{attr._id}"
                                      >
                                        <span>{attr.label}</span>
                                        <!-- Zeigt den Typ dezent auf der rechten Seite an -->
                                        <span
                                          class="badge bg-light text-secondary border"
                                          style="font-size: 0.65rem;"
                                        >
                                          {attr.ui_type === "select"
                                            ? attr.is_multiple
                                              ? "Multi-Dropdown"
                                              : "Dropdown"
                                            : attr.ui_type}
                                        </span>
                                      </label>
                                    </div>
                                  {:else}
                                    <p
                                      class="small text-muted mb-0 p-2 text-center"
                                    >
                                      Keine passenden Attribute gefunden.
                                    </p>
                                  {/each}
                                </div>
                              </div>

                              <button
                                type="submit"
                                class="btn btn-sm btn-success w-100"
                              >
                                <i class="bi bi-save"></i> Zuweisung speichern
                              </button>
                            </form>
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-muted small fst-italic mb-4">
                    Noch keine Unterkategorien vorhanden.
                  </p>
                {/if}

                <!-- Formular: Neue Unterkategorie -->
                {#if searchQuery.trim() === ""}
                  <div class="bg-white p-3 rounded border">
                    <label
                      for="subName-{category._id}"
                      class="form-label small fw-bold text-dark"
                      >Neue Unterkategorie in "{category.name}" hinzufügen</label
                    >
                    <form
                      method="POST"
                      action="?/createSub"
                      use:enhance={() => {
                        return async ({ update }) => {
                          await update();
                          newSubName = "";
                        };
                      }}
                    >
                      <input type="hidden" name="mainId" value={category._id} />
                      <div class="input-group">
                        <input
                          type="text"
                          id="subName-{category._id}"
                          name="subName"
                          class="form-control"
                          placeholder="z.B. Schrauben..."
                          bind:value={newSubName}
                          required
                        />
                        <button class="btn btn-primary px-4" type="submit"
                          >Hinzufügen</button
                        >
                      </div>
                    </form>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
