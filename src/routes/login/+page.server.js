// src/routes/login/+page.server.js
import { redirect, fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import dbClient from '$lib/server/db.js'; // Dein DB-Client

export async function load({ cookies }) {
    if (cookies.get('session')) {
        throw redirect(303, '/');
    }
}

export const actions = {
    login: async ({ request, cookies, getClientAddress }) => {
        const db = await dbClient.getDb();
        const ip = getClientAddress();
        const now = new Date();
        
        // 1. Bisherige Versuche aus der DB laden
        let attemptData = await db.collection('loginAttempts').findOne({ ip: ip });
        
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

            // In MongoDB speichern/updaten (upsert: true legt es an, falls es nicht existiert)
            await db.collection('loginAttempts').updateOne(
                { ip: ip },
                { 
                    $set: { 
                        count: attemptData.count, 
                        lockUntil: lockTime,
                        createdAt: new Date() // WICHTIG für den TTL-Index!
                    } 
                },
                { upsert: true }
            );

            if (attemptData.count >= 5) {
                return fail(429, { error: '5 Fehlversuche erreicht. IP für 5 Minuten gesperrt.' });
            }
            
            const attemptsLeft = 5 - attemptData.count;
            return fail(401, { error: `E-Mail oder Passwort falsch. Noch ${attemptsLeft} Versuch(e).` });
        };

        // 3. Nutzer suchen & Timing-Attack-Schutz
        const user = await db.collection('users').findOne({ email: email });
        let isPasswordValid = false;

        if (user) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Dummy-Hash prüfen, damit Angreifer nicht an der Antwortzeit erkennen, ob die Mail existiert
            await bcrypt.compare(password, "$2a$10$dummyHashThatTakesRoughlyTheSameTimeHere1234567890123");
        }

        if (!user || !isPasswordValid) return registerFailedAttempt();

        if (user.isVerified === false) {
            return fail(403, { error: 'Bitte bestätige zuerst deine E-Mail-Adresse.' });
        }

        // 4. LOGIN ERFOLGREICH!
        
        // Alte Fehlversuche dieser IP löschen
        await db.collection('loginAttempts').deleteOne({ ip: ip });

        // FEHLERBEHEBUNG: Wir nutzen zwingend die MongoDB User-ID als Session-ID,
        // da dein +layout.server.js genau diese ID für die Validierung benötigt!
        const sessionId = user._id.toString(); 

        // 5. Aktivitäts-Log (Session Start) eintragen
        await db.collection('sessionLogs').insertOne({
            sessionId: sessionId,
            userId: user._id,
            email: user.email,
            loginTime: new Date(),
            logoutTime: null, // Wird beim Logout gesetzt
            lastActive: new Date(),
            createdAt: new Date() // WICHTIG für den TTL-Index!
        });

        // Cookie setzen
        cookies.set('session', sessionId, {
            path: '/', 
            httpOnly: true, 
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production', 
            maxAge: 60 * 60 * 24 * 7 // 7 Tage gültig
        });

        // WICHTIG: Wir leiten hier auf das Root-Verzeichnis '/' um. 
        // Falls deine Startseite nach dem Login einen anderen Pfad hat (z.B. '/dashboard'),
        // musst du das '/' hier entsprechend anpassen!
        throw redirect(303, '/'); 
    }
};