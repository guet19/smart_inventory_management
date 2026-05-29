<script>
    import { enhance } from '$app/forms';
    export let form;
</script>

<div class="register-container space-grotesk">
    <div class="register-card">
        <div class="register-header">
            <h1>Account erstellen</h1>
            <p>Registriere dich für dein persönliches Storify Inventar.</p>
        </div>

        <form method="POST" use:enhance class="register-form">
            <div class="form-row">
                <div class="input-group">
                    <label for="firstName">Vorname *</label>
                    <input type="text" id="firstName" name="firstName" required placeholder="Max" value={form?.data?.firstName || ''}/>
                </div>
                
                <div class="input-group">
                    <label for="lastName">Nachname *</label>
                    <input type="text" id="lastName" name="lastName" required placeholder="Mustermann" />
                </div>
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label for="country">Land</label>
                    <input type="text" id="country" name="country" placeholder="z.B. Schweiz" />
                </div>
                
                <div class="input-group">
                    <label for="birthDate">Geburtsdatum</label>
                    <input type="date" id="birthDate" name="birthDate" />
                </div>
            </div>

            <div class="divider-subtle"></div>

            <div class="input-group">
                <label for="email">E-Mail Adresse *</label>
                <input type="email" id="email" name="email" required placeholder="name@beispiel.ch" />
            </div>

            <div class="form-row">
                <div class="input-group">
                    <label for="password">Passwort *</label>
                    <input type="password" id="password" name="password" required placeholder="Min. 6 Zeichen" />
                </div>
                
                <div class="input-group">
                    <label for="passwordConfirm">Passwort bestätigen *</label>
                    <input type="password" id="passwordConfirm" name="passwordConfirm" required placeholder="Passwort wiederholen" />
                </div>
            </div>

            {#if form?.error}
                <div class="error-message">
                    {form.error}
                </div>
            {/if}

            <button type="submit" class="btn-primary">Jetzt registrieren</button>
            
            <div class="back-to-login">
                Bereits einen Account? <a href="/login">Hier anmelden</a>
            </div>
        </form>
    </div>
</div>

<style>
    .register-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f8fafc; padding: 2rem 1rem; color: #334155; }
    .register-card { background: #ffffff; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); width: 100%; max-width: 600px; border: 1px solid #e2e8f0; }
    
    .register-header { text-align: center; margin-bottom: 2rem; }
    .register-header h1 { margin: 0 0 0.5rem 0; color: #22c55e; font-size: 1.8rem; }
    .register-header p { margin: 0; color: #64748b; font-size: 0.95rem; }
    
    .register-form { display: flex; flex-direction: column; gap: 1.2rem; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .input-group { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; min-width: 200px; }
    
    label { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    input { padding: 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; background: #f8fafc; color: #334155; transition: all 0.2s; box-sizing: border-box; width: 100%;}
    input:focus { outline: none; border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    .divider-subtle { height: 1px; background: #e2e8f0; margin: 0.5rem 0; }
    
    .btn-primary { background: #3b82f6; color: white; padding: 0.9rem; border: none; border-radius: 6px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.2s; margin-top: 1rem; width: 100%; }
    .btn-primary:hover { background: #2563eb; }
    
    .back-to-login { text-align: center; margin-top: 1rem; font-size: 0.9rem; color: #64748b; }
    .back-to-login a { color: #3b82f6; text-decoration: none; font-weight: 600; }
    .back-to-login a:hover { text-decoration: underline; }

    .error-message { background: #fef2f2; color: #b91c1c; padding: 0.8rem; border-radius: 6px; border: 1px solid #fecaca; font-size: 0.9rem; text-align: center; font-weight: 600; animation: shake 0.4s ease-in-out; }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
</style>