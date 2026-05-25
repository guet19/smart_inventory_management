<script>
	import "./styles.css";
	import { page } from '$app/stores'; //
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>
<nav class="navbar navbar-expand-lg bg-body-tertiary">
	<div class="container">
	  <a class="navbar-brand d-flex align-items-center gap-1 space-grotesk" style="color:#22c55e;" href="/">
		<img src={favicon} alt="Logo" width="50" height="40" class="d-inline-block align-text-top" >Sortify</a>
	  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
		<span class="navbar-toggler-icon"></span>
	  </button>
	  <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
		<div class="navbar-nav">
			<a class="nav-link " class:active={$page.url.pathname === '/'} href="/">Inventar</a>
			<a class="nav-link " class:active={$page.url.pathname === '/einstellungen'} href="/einstellungen">Kategorien/Filter verwalten </a>
		</div>
	  </div>
	</div>
  </nav>



{@render children()}



