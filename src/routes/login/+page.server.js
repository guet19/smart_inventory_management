// src/routes/login/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import db from '$lib/server/db.js';

// Serverseitiger Speicher für Fehlversuche: IP-Adresse -> { count, lockUntil }
const loginAttempts = new Map();

export async function load({ cookies }) {
    if (cookies.get('session')) {
        throw redirect(303, '/');
    }
}

export const actions = {
    login: async ({ request, cookies, getClientAddress }) => {
        // 1. IP-Adresse des Nutzers auslesen
        const ip = getClientAddress();
        const now = Date.now();
        
        // Bisherige Versuche dieser IP laden (oder Startwerte setzen)
        const attemptData = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };

        // 2. Prüfen, ob die IP aktuell gesperrt ist
        if (attemptData.lockUntil > now) {
            const remainingMinutes = Math.ceil((attemptData.lockUntil - now) / 60000);
            return fail(429, { 
                error: `Zu viele Fehlversuche. Deine IP ist für ${remainingMinutes} Minute(n) gesperrt.` 
            });
        }

        const data = await request.formData();
        const email = data.get('email');
        const password = data.get('password');

        if (!email || !password) {
            return fail(400, { error: 'Bitte fülle alle Felder aus.' });
        }

        // Hilfsfunktion: Wird aufgerufen, wenn E-Mail oder Passwort falsch sind
        const registerFailedAttempt = () => {
            attemptData.count += 1;
            
            if (attemptData.count >= 5) {
                attemptData.lockUntil = now + 5 * 60 * 1000; // 5 Minuten Sperre (in Millisekunden)
                loginAttempts.set(ip, attemptData);
                return fail(429, { error: '5 Fehlversuche erreicht. IP für 5 Minuten gesperrt.' });
            }
            
            loginAttempts.set(ip, attemptData);
            const attemptsLeft = 5 - attemptData.count;
            return fail(401, { error: `E-Mail oder Passwort falsch. Noch ${attemptsLeft} Versuch(e).` });
        };

        // 3. Nutzer in der DB suchen
        const user = await db.getUserByEmail(email);
        if (!user) {
            return registerFailedAttempt();
        }

        // 4. Passwort prüfen
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return registerFailedAttempt();

        // NEU: Prüfen, ob die E-Mail verifiziert wurde
        if (user.isVerified === false) {
            return fail(403, { error: 'Bitte bestätige zuerst deine E-Mail-Adresse (prüfe auch den Spam-Ordner).' });
        }

        // 5. Login erfolgreich! Fehlversuche für diese IP löschen
        loginAttempts.delete(ip);

        // Session-Cookie setzen
        const sessionId = user._id.toString(); 
        cookies.set('session', sessionId, {
            path: '/', 
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 60 * 60 * 24 * 7 // 7 Tage gültig
        });

        throw redirect(303, '/'); 
    }
};