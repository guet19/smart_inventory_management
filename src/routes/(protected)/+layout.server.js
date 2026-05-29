import { redirect } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function load({ cookies }) {
    const session = cookies.get('session');

    if (!session) {
        throw redirect(303, '/login');
    }

    // Nutzer anhand der Session (userId) aus der DB holen
    const user = await db.getUserById(session);

    // Falls die Session noch im Browser ist, der Nutzer in der DB aber gelöscht wurde
    if (!user) {
        cookies.delete('session', { path: '/' });
        throw redirect(303, '/login');
    }

    // Wir geben nur die unkritischen Daten ans Frontend weiter (kein Passwort!)
    return {
        isLoggedIn: true,
        user: {
            firstName: user.firstName || 'Benutzer',
            lastName: user.lastName || '',
            email: user.email
        }
    };
}