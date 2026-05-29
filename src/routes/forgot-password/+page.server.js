import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { sendPasswordResetEmail } from '$lib/server/email.js'; // Pfad ggf. anpassen

export const actions = {
    default: async ({ request, url }) => {
        const data = await request.formData();
        const email = data.get('email');

        if (!email) return fail(400, { error: 'Bitte gib eine E-Mail-Adresse ein.' });

        // Token in der DB generieren
        const token = await db.savePasswordResetToken(email);

        // WICHTIG FÜR SECURITY: Wir geben immer eine Erfolgsmeldung zurück, 
        // auch wenn die E-Mail nicht existiert. Sonst könnten Hacker testen, welche E-Mails registriert sind.
        if (token) {
            await sendPasswordResetEmail(email, token, url.origin);
        }

        return { success: true };
    }
};