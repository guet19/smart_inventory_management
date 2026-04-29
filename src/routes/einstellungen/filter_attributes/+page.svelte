<script>
  import { enhance } from "$app/forms";
  let { data, form } = $props();

  let label = $state("");
  let ui_type = $state("text");
  let unit = $state("");
  let currentOption = $state("");
  let optionsList = $state([]);
  let isMultiple = $state(false);
  let editingId = $state(null);

  let successMessage = $state("");
  let successTimeout;

  function showSuccessMessage(msg, duration = 3000) {
    successMessage = msg;
    if (successTimeout) clearTimeout(successTimeout);
    successTimeout = setTimeout(() => {
      successMessage = "";
    }, duration);
  }

  // DER WACHHUND (Svelte 5 Effekt): Reagiert sofort, wenn der Server antwortet
  $effect(() => {
    // Wenn der Server { success: true } sendet...
    if (form?.success) {
      cancelEdit(); // Formular zurücksetzen
      // Nachricht vom Server holen (oder Fallback anzeigen)
      showSuccessMessage(form?.message || "keine Rcükmeldung vom Server!");
    }
  });

  function startEdit(attr) {
    editingId = attr._id;
    label = attr.label;
    ui_type = attr.ui_type;
    unit = attr.unit || "";
    isMultiple = attr.is_multiple || false;
    optionsList = attr.options ? [...attr.options] : [];
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    editingId = null;
    label = "";
    ui_type = "text";
    unit = "";
    optionsList = [];
    isMultiple = false;
  }

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

<div class="container mt-4 mb-5 pb-5">
  <h1 class="mb-4">Filtermöglichkeiten verwalten</h1>

  {#if successMessage}
    <div
      class="alert alert-success d-flex align-items-center animate-fade-in shadow-sm mb-4"
      role="alert"
    >
      <i class="bi bi-check-circle-fill me-2 fs-5"></i>
      <div>{successMessage}</div>
    </div>
  {/if}

  <div class="row">
    <div class="col-md-5 mb-4">
      <div class="card shadow-sm border-0 bg-dark text-white p-4">
        <h3 class="h5 mb-4">
          {editingId ? "Attribut bearbeiten" : "Neues Filter-Attribut anlegen"}
        </h3>

        <form
          method="POST"
          action={editingId ? "?/update" : "?/create"}
          use:enhance
        >
          {#if editingId}
            <input type="hidden" name="id" value={editingId} />
          {/if}

          <div class="mb-3">
            <label for="label" class="form-label small"
              >Anzeigename (z.B. Gewinde)</label
            >
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
              <option value="select">Dropdown (Auswahlliste)</option>
            </select>
          </div>

          <div class="mb-3">
            <label for="unit" class="form-label small">Einheit (optional)</label
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
              <small class="text-muted d-block mt-1">
                {isMultiple
                  ? "Nutzer können mehrere Werte gleichzeitig wählen"
                  : "Nutzer können nur exakt einen Wert wählen."}
              </small>
            </div>

            <div class="mb-3">
              <label for="optionInput" class="form-label small text-muted"
                >Auswahl-Optionen (Werte)</label
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
                  class="btn btn-primary"
                  aria-label="Hinzufügen"
                  onclick={addOption}>+</button
                >
              </div>

              <div class="d-flex flex-wrap gap-2 mt-2">
                {#each optionsList as opt, i}
                  <span
                    class="badge bg-primary d-flex align-items-center gap-2"
                  >
                    {opt}
                    <button
                      type="button"
                      class="btn-close btn-close-white"
                      style="font-size: 0.5rem"
                      aria-label="Option entfernen"
                      onclick={() => removeOption(i)}
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

          <div class="d-flex gap-2 mt-3">
            <button type="submit" class="btn btn-success flex-grow-1 fw-bold">
              {editingId ? "Änderungen speichern" : "Attribut speichern"}
            </button>
            {#if editingId}
              <button
                type="button"
                class="btn btn-outline-light"
                onclick={cancelEdit}>Abbrechen</button
              >
            {/if}
          </div>

          {#if form?.error}
            <p class="text-danger small mt-2">{form.error}</p>
          {/if}
        </form>
      </div>
    </div>

    <div class="col-md-7">
      <h3 class="h5 mb-4">Vorhandene Filtermöglichkeiten</h3>

      <div class="list-group shadow-sm">
        {#each data?.attributeLibrary ?? [] as attr}
          <div
            class="list-group-item list-group-item-action p-0 overflow-hidden"
          >
            <button
              class="w-100 border-0 bg-transparent p-3 d-flex justify-content-between align-items-center text-start"
              onclick={() => toggleAttribute(attr._id)}
            >
              <div>
                <span class="fw-bold text-primary">{attr.label}</span>
                <span class="badge bg-light text-dark ms-2 border"
                  >{attr.ui_type}</span
                >
                {#if attr.ui_type === "select" && attr.is_multiple}
                  <span class="badge bg-info text-dark ms-1">Multi</span>
                {/if}
              </div>
              <i
                class="bi {expandedId === attr._id
                  ? 'bi-chevron-up'
                  : 'bi-chevron-down'}"
              ></i>
            </button>

            {#if expandedId === attr._id}
              <div class="p-3 bg-light border-top animate-fade-in">
                <div class="row">
                  <div class="col-md-4">
                    <p class="small text-muted mb-1">Eingabetyp:</p>
                    <strong
                      >{attr.ui_type === "select"
                        ? "Dropdown (Auswahl)"
                        : "Freitext / Zahl"}</strong
                    >
                    {#if attr.ui_type === "select"}
                      <div class="mt-2 small text-secondary">
                        <i
                          class="bi {attr.is_multiple
                            ? 'bi-check-all'
                            : 'bi-check-circle'}"
                        ></i>
                        {attr.is_multiple ? "Mehrfachauswahl" : "Einzelauswahl"}
                      </div>
                    {/if}
                  </div>

                  {#if attr.options && attr.options.length > 0}
                    <div class="col-md-8">
                      <p class="small text-muted mb-1">
                        Erlaubte Werte (Optionen):
                      </p>
                      <div class="d-flex flex-wrap gap-1">
                        {#each attr.options as option}
                          <span
                            class="badge bg-white text-primary border border-primary-subtle"
                            >{option}</span
                          >
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <div class="mt-3 pt-3 border-top d-flex gap-2">
                  <button
                    class="btn btn-sm btn-outline-secondary"
                    onclick={() => startEdit(attr)}>Bearbeiten</button
                  >

                  <form
                    method="POST"
                    action="?/delete"
                    use:enhance
                    onsubmit={() =>
                      confirm(
                        `Möchtest du das Attribut "${attr.label}" wirklich unwiderruflich löschen?`,
                      )}
                  >
                    <input type="hidden" name="id" value={attr._id} />
                    <input type="hidden" name="label" value={attr.label} />
                    <button type="submit" class="btn btn-sm btn-outline-danger"
                      >Löschen</button
                    >
                  </form>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      {#if !data?.attributeLibrary?.length}
        <div class="alert alert-info mt-3">
          Keine Attribute in der Bibliothek gefunden.
        </div>
      {/if}
    </div>
  </div>
</div>

<footer class="fixed-bottom bg-body-tertiary border-top p-3 d-flex shadow-sm">
  <div class="container">
    <a class="btn btn-primary px-4 back" href="/einstellungen">Zurück</a>
  </div>
</footer>

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
  label {
    color: white;
  }
  h3 {
    color: #22c55e;
  }
</style>
