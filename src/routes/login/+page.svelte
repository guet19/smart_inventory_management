<script>
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';

    export let form;

    // Status-Variablen für die verschiedenen Meldungen
    let showLogoutMessage = false;
    let showRegisterMessage = false;
    let showResetSuccess = false;
    let showResetError = false;

    // 1. Logout abfangen
    $: if ($page.url.searchParams.get('loggedOut') === 'true') {
        showLogoutMessage = true;
        cleanUrlParameter('loggedOut');
        setTimeout(() => showLogoutMessage = false, 4000);
    }

    // 2. Erfolgreiche Registrierung abfangen
    $: if ($page.url.searchParams.get('registered') === 'true') {
        showRegisterMessage = true;
        cleanUrlParameter('registered');
        setTimeout(() => showRegisterMessage = false, 4000);
    }

    // 3. Erfolgreicher Passwort-Reset abfangen
    $: if ($page.url.searchParams.get('passwordReset') === 'true') {
        showResetSuccess = true;
        cleanUrlParameter('passwordReset');
        setTimeout(() => showResetSuccess = false, 5000);
    }

    // 4. Fehlerhafter Passwort-Reset (Token abgelaufen) abfangen
    $: if ($page.url.searchParams.get('resetError') === 'true') {
        showResetError = true;
        cleanUrlParameter('resetError');
        setTimeout(() => showResetError = false, 6000);
    }

    // Hilfsfunktion: URL-Parameter optisch bereinigen, ohne die Seite neu zu laden
    function cleanUrlParameter(paramName) {
        if (browser) {
            const url = new URL(window.location.href);
            url.searchParams.delete(paramName);
            window.history.replaceState({}, '', url);
        }
    }
</script>

<svelte:head>
    <title>Login | Sortify Inventar</title>
</svelte:head>

<div class="login-container space-grotesk">
    <div class="login-card">
        <div class="login-header">
            <h1>Sortify Login</h1>
            <p>Bitte melde dich an, um auf das Inventar zuzugreifen.</p>
        </div>

        {#if showLogoutMessage}
            <div class="success-banner">Du wurdest erfolgreich abgemeldet.</div>
        {/if}

        {#if showRegisterMessage}
            <div class="success-banner">Registrierung erfolgreich! Du kannst dich nun anmelden.</div>
        {/if}

        {#if showResetSuccess}
            <div class="success-banner">Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt anmelden.</div>
        {/if}

        {#if showResetError}
            <div class="error-message">Der Reset-Link war ungültig oder ist abgelaufen. Bitte fordere einen neuen an.</div>
        {/if}

        <form method="POST" action="?/login" use:enhance class="login-form">
            
            <div class="input-group">
                <label for="email">E-Mail Adresse</label>
                <input type="email" id="email" name="email" required placeholder="name@beispiel.ch" />
            </div>

            <div class="input-group">
                <div class="password-label-row">
                    <label for="password">Passwort</label>
                    <a href="/forgot-password" class="forgot-link">Passwort vergessen?</a>
                </div>
                <input type="password" id="password" name="password" required placeholder="••••••••" />
            </div>

            {#if form?.error}
                <div class="error-message">
                    {form.error}
                </div>
            {/if}

            <button type="submit" class="btn-primary">Anmelden</button>
            
            <div class="divider">
                <span>oder</span>
            </div>
            
            <a href="/register" class="btn-secondary">Neuen Account registrieren</a>
        </form>
    </div>
</div>

<style>
    /* Generelles Body-Styling für den Hintergrund */
    .body { 
        font-family: 'Space Grotesk', sans-serif; 
        margin: 0;
    }

    /* Erfolgs- & Fehlermeldungen */
    .success-banner { background: #dcfce7; color: #166534; padding: 0.8rem; border-radius: 6px; border: 1px solid #bbf7d0; font-size: 0.95rem; text-align: center; font-weight: 600; margin-bottom: 1.5rem; animation: slideDown 0.3s ease-out; }
    .error-message { background: #fef2f2; color: #b91c1c; padding: 0.8rem; border-radius: 6px; border: 1px solid #fecaca; font-size: 0.9rem; text-align: center; font-weight: 600; margin-bottom: 1.5rem; animation: shake 0.4s ease-in-out; }
    
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }

    /* Layout & Weisse Karte auf dunklem Grund */
    .login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1rem; }
    .login-card { background: #ffffff; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.05); width: 100%; max-width: 400px; border: 1px solid #e2e8f0; }
    
    /* Texte innerhalb der Karte */
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-header h1 { margin: 0 0 0.5rem 0; color: #22c55e; font-size: 1.8rem; }
    .login-header p { margin: 0; color: #64748b; font-size: 0.95rem; line-height: 1.5; }
    
    /* Formular & Helle Inputs */
    .login-form { display: flex; flex-direction: column; gap: 1.2rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    
    /* Passwort-Zeile mit Link "Passwort vergessen" */
    .password-label-row { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { font-size: 0.8rem; color: #3b82f6; text-decoration: none; font-weight: 600; transition: color 0.2s; }
    .forgot-link:hover { color: #2563eb; text-decoration: underline; }

    input { padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; background: #f8fafc; color: #334155; transition: all 0.2s; box-sizing: border-box; width: 100%; }
    input::placeholder { color: #94a3b8; }
    input:focus { outline: none; border-color: #22c55e; background: #ffffff; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15); }
    
    /* Buttons */
    .btn-primary { background: #22c55e; color: #ffffff; padding: 0.8rem; border: none; border-radius: 6px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
    .btn-primary:hover { background: #16a34a; transform: translateY(-1px); }
    
    /* Teiler & Sekundärer Button */
    .divider { display: flex; align-items: center; text-align: center; margin: 0.5rem 0; color: #94a3b8; font-size: 0.85rem; }
    .divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
    .divider span { padding: 0 10px; }

    .btn-secondary { display: block; text-align: center; text-decoration: none; background: transparent; color: #3b82f6; padding: 0.8rem; border: 1px solid #3b82f6; border-radius: 6px; font-weight: 600; font-size: 1rem; transition: all 0.2s; }
    .btn-secondary:hover { background: #eff6ff; }
</style>