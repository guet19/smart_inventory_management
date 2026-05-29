// src/routes/register/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js';
import { sendVerificationEmail } from '$lib/server/email.js';
import crypto from 'crypto'; 

export async function load({ cookies }) {
    // Wenn man schon eingeloggt ist, braucht man sich nicht registrieren
    if (cookies.get('session')) {
        throw redirect(303, '/');
    }
}

export const actions = {
    default: async ({ request, url }) => {
        const data = await request.formData();
        
        // 1. Alle Felder aus dem Formular auslesen (Hier haben sie gefehlt!)
        const email = data.get('email')?.toString().trim();
        const password = data.get('password')?.toString();
        const passwordConfirm = data.get('passwordConfirm')?.toString();
        
        const firstName = data.get('firstName')?.toString().trim() || "";
        const lastName = data.get('lastName')?.toString().trim() || "";
        const country = data.get('country')?.toString().trim() || "";
        const birthDate = data.get('birthDate')?.toString() || null;

        // 2. Basis-Validierung
        if (!email || !password || !firstName || !lastName) {
            return fail(400, { error: "Bitte fülle alle Pflichtfelder aus." });
        }

        if (password !== passwordConfirm) {
            return fail(400, { error: "Die Passwörter stimmen nicht überein." });
        }

        if (password.length < 6) {
            return fail(400, { error: "Das Passwort muss mindestens 6 Zeichen lang sein." });
        }

        try {
            // 3. Sicherheitstoken und Code generieren
            const vCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-stelliger Code
            const vToken = crypto.randomUUID(); // Langer Magic Link Token
            const vExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minuten gültig

            // 4. Daten-Pakete schnüren
            const verificationData = { code: vCode, token: vToken, expires: vExpires };
            const profileData = { firstName, lastName, country, birthDate };

            // 5. Nutzer in MongoDB anlegen
            const result = await db.createInitialUser(email, password, profileData, verificationData);
            
            if (!result.success) {
                return fail(400, { error: result.message }); // z.B. "Benutzer existiert bereits"
            }

           // 6. E-Mail asynchron im Hintergrund versenden
            await sendVerificationEmail(email, vCode, vToken);

            // 7. Zur Verifizierungs-Seite leiten (E-Mail in der URL übergeben)
            throw redirect(303, `/verify?email=${encodeURIComponent(email)}`);

        } catch (err) {
            // Wichtig: Redirects werfen intern einen Fehler, den müssen wir durchlassen!
            if (err.status === 303) throw err;
            
            console.error("Fehler bei der Registrierung:", err);
            return fail(500, { error: "Ein unerwarteter Fehler ist aufgetreten." });
        }
    }
};