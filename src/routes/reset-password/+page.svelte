<script>
    import { enhance } from '$app/forms';
    export let form;
</script>

<div class="login-container space-grotesk">
    <div class="login-card">
        <div class="login-header">
            <h1>Neues Passwort</h1>
            <p>Bitte vergib ein neues, sicheres Passwort für deinen Account.</p>
        </div>

        <form method="POST" use:enhance class="login-form">
            <div class="input-group">
                <label for="password">Neues Passwort</label>
                <input type="password" id="password" name="password" required minlength="8" />
            </div>

            <div class="input-group">
                <label for="passwordConfirm">Passwort wiederholen</label>
                <input type="password" id="passwordConfirm" name="passwordConfirm" required minlength="8" />
            </div>

            {#if form?.error}
                <div class="error-message">{form.error}</div>
            {/if}

            <button type="submit" class="btn-primary" style="background: #3b82f6; color: white;">Passwort speichern</button>
        </form>
    </div>
</div>

<style>
    /* Auch hier wieder deinen Standard-Style-Block der Login-Seite einfügen */
</style>