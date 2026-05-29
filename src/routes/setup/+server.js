import { json } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function GET() {
    // Hier werden die erweiterten Profildaten definiert
    const profile = {
        firstName: 'Max',
        lastName: 'Mustermann',
        country: 'Schweiz',
        birthDate: '1999-05-29' // Format: YYYY-MM-DD
    };

    // Die Daten werden als dritter Parameter übergeben
    const result = await db.createInitialUser('admin2@storify.ch', 'geheim123', profile);
    
    return json(result);
}