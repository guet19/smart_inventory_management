// src/routes/login/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import db from '$lib/server/db.js'; // WICHTIG: Direkt db importieren

export async function load({ cookies }) {
    if (cookies.get('session')) {
        throw redirect(303, '/');
    }
}

export const actions = {
    login: async ({ request, cookies, getClientAddress }) => {
        const ip = getClientAddress();
        const now = new Date();
        
        // 1. Bisherige Versuche über deine Hilfsfunktion laden
        let attemptData = await db.getLoginAttempt(ip);
        
        if (!attemptData) {
            attemptData = { ip: ip, count: 0, lockUntil: new Date(0) };
        }

        // 2. Prüfen, ob die IP aktuell gesperrt ist
        if (attemptData.lockUntil > now) {
            const remainingMinutes = Math.ceil((attemptData.lockUntil.getTime() - now.getTime()) / 60000);
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

        // Hilfsfunktion für Fehlversuche
        const registerFailedAttempt = async () => {
            attemptData.count += 1;
            let lockTime = attemptData.lockUntil;
            
            if (attemptData.count >= 5) {
                // Sperre für 5 Minuten setzen
                lockTime = new Date(now.getTime() + 5 * 60 * 1000); 
            }

            // Speichern über deine Hilfsfunktion
            await db.upsertLoginAttempt(ip, attemptData.count, lockTime);

            if (attemptData.count >= 5) {
                return fail(429, { error: '5 Fehlversuche erreicht. IP für 5 Minuten gesperrt.' });
            }
            
            const attemptsLeft = 5 - attemptData.count;
            return fail(401, { error: `E-Mail oder Passwort falsch. Noch ${attemptsLeft} Versuch(e).` });
        };

        // 3. Nutzer suchen & Timing-Attack-Schutz
        const user = await db.getUserByEmail(email);
        let isPasswordValid = false;

        if (user) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Dummy-Hash prüfen
            await bcrypt.compare(password, "$2a$10$dummyHashThatTakesRoughlyTheSameTimeHere1234567890123");
        }

        if (!user || !isPasswordValid) return registerFailedAttempt();

        if (user.isVerified === false) {
            return fail(403, { error: 'Bitte bestätige zuerst deine E-Mail-Adresse (prüfe auch den Spam-Ordner).' });
        }

        // 4. LOGIN ERFOLGREICH!
        
        // Alte Fehlversuche über Hilfsfunktion löschen
        await db.deleteLoginAttempt(ip);

        // Die echte MongoDB User-ID als Session-ID nutzen
        const sessionId = user._id.toString(); 

        // 5. Session Log über Hilfsfunktion anlegen
        await db.createSessionLog(sessionId, user._id, user.email);

        // Cookie setzen
        cookies.set('session', sessionId, {
            path: '/', 
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 60 * 60 * 24 * 7 // 7 Tage gültig
        });

        // Ab aufs Dashboard!
        throw redirect(303, '/'); 
    }
};