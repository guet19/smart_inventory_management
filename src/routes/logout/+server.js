import { redirect } from '@sveltejs/kit';
import dbClient from '$lib/server/db.js';

export const actions = {
    default: async ({ cookies }) => {
        const sessionId = cookies.get('session');
        const db = await dbClient.getDb();

        if (sessionId) {
            // Log-Eintrag abschließen: logoutTime setzen
            await db.collection('sessionLogs').updateOne(
                { sessionId: sessionId },
                { $set: { logoutTime: new Date(), lastActive: new Date() } }
            );
        }

        // Cookie löschen
        cookies.delete('session', { path: '/' });

        throw redirect(303, '/login?loggedOut=true');
    }
};