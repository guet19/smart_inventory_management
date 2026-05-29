<script>
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    export let form;
</script>

<div class="verify-container space-grotesk">
    <div class="verify-card">
        <h2>E-Mail bestätigen</h2>
        <p>Wir haben einen 6-stelligen Code an <strong>{$page.url.searchParams.get('email')}</strong> gesendet.</p>
        
        <form method="POST" use:enhance>
            <input type="hidden" name="email" value={$page.url.searchParams.get('email')} />
            
            <div class="input-group">
                <input type="text" name="code" placeholder="123456" maxlength="6" class="code-input" required autocomplete="off" />
            </div>

            {#if form?.error}
                <div class="error-message">{form.error}</div>
            {/if}

            <button type="submit" class="btn-primary">Bestätigen</button>
        </form>
    </div>
</div>

<style>
    /* Füge hier dein Standard-Styling ein. .verify-container (wie .login-container), etc. */
    .code-input { font-size: 2rem; letter-spacing: 0.5rem; text-align: center; font-family: monospace; }
</style>