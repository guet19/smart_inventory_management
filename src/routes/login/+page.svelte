<script>
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { browser } from '$app/environment';

    export let form;

    let showLogoutMessage = false;

    // Reaktiv auf den URL-Parameter hören
    $: if ($page.url.searchParams.get('loggedOut') === 'true') {
        showLogoutMessage = true;
        
        if (browser) {
            // Parameter aus der URL entfernen, ohne die Seite neu zu laden
            const url = new URL(window.location.href);
            url.searchParams.delete('loggedOut');
            window.history.replaceState({}, '', url);
            
            // Meldung nach 4 Sekunden automatisch ausblenden
            setTimeout(() => {
                showLogoutMessage = false;
            }, 4000);
        }
    }
    // In src/routes/login/+page.svelte (zu den anderen URL-Parametern hinzufügen)
    let showRegisterMessage = false;

    $: if ($page.url.searchParams.get('registered') === 'true') {
        showRegisterMessage = true;
        if (browser) {
            const url = new URL(window.location.href);
            url.searchParams.delete('registered');
            window.history.replaceState({}, '', url);
            setTimeout(() => showRegisterMessage = false, 4000);
        }
    }
</script>

<div class="login-container space-grotesk">
    <div class="login-card">
        <div class="login-header">
            <h1>Storify Login</h1>
            <p>Bitte melde dich an, um auf das Inventar zuzugreifen.</p>
        </div>

        {#if showLogoutMessage}
            <div class="success-banner">
                Du wurdest erfolgreich abgemeldet.
            </div>
        {/if}

        <form method="POST" action="?/login" use:enhance class="login-form">
            <div class="input-group">
                <label for="email">E-Mail Adresse</label>
                <input type="email" id="email" name="email" required placeholder="name@beispiel.ch" />
            </div>

            <div class="input-group">
                <label for="password">Passwort</label>
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
    /* ... Dein bestehendes CSS für .login-container etc. bleibt hier ... */

    /* Die neuen CSS-Klassen für die Warnungen und Erfolgsmeldungen */
    .success-banner {
        background: #dcfce7;
        color: #166534;
        padding: 0.8rem;
        border-radius: 6px;
        border: 1px solid #bbf7d0;
        font-size: 0.95rem;
        text-align: center;
        font-weight: 600;
        margin-bottom: 1.5rem;
        animation: slideDown 0.3s ease-out;
    }

    .error-message {
        background: #fef2f2;
        color: #b91c1c;
        padding: 0.8rem;
        border-radius: 6px;
        border: 1px solid #fecaca;
        font-size: 0.9rem;
        text-align: center;
        font-weight: 600;
        animation: shake 0.4s ease-in-out;
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
    }
    
    /* Füge hier den Rest deines bestehenden CSS wieder ein (z.B. für .login-card, input, button) */
    .login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f8fafc; padding: 1rem; color: #334155; }
    .login-card { background: #ffffff; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; border: 1px solid #e2e8f0; }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-header h1 { margin: 0 0 0.5rem 0; color: #22c55e; font-size: 1.8rem; }
    .login-header p { margin: 0; color: #64748b; font-size: 0.95rem; }
    .login-form { display: flex; flex-direction: column; gap: 1.2rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    input { padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; background: #f8fafc; color: #334155; transition: all 0.2s; }
    input:focus { outline: none; border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .btn-primary { background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 6px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.2s; margin-top: 0.5rem; }
    .btn-primary:hover { background: #2563eb; }

    .divider {
        display: flex; align-items: center; text-align: center; margin: 0.5rem 0; color: #94a3b8; font-size: 0.85rem;
    }
    .divider::before, .divider::after {
        content: ''; flex: 1; border-bottom: 1px solid #e2e8f0;
    }
    .divider span { padding: 0 10px; }

    .btn-secondary {
        display: block; text-align: center; text-decoration: none;
        background: transparent; color: #3b82f6; padding: 0.8rem;
        border: 1px solid #3b82f6; border-radius: 6px; font-weight: 600; font-size: 1rem;
        transition: all 0.2s;
    }
    .btn-secondary:hover { background: #eff6ff; }
</style>