<script>
    let {data} = $props();
</script>

<div class="container">
  <h1 class="space-grotesk mt-3">Kategorien bearbeiten</h1>
</div>
{#each data.categories as category}
<p>{category.name}</p>
{/each}
<footer class="fixed-bottom bg-body-tertiary border-top p-3 d-flex shadow-sm">
  <div class="container">
    <a class="btn btn-primary px-4 back" href="/einstellungen">Zurück</a>
  </div>
</footer>
