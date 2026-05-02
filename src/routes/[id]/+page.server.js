// src/routes/[id]/+page.server.js
import db from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    // 1. Die ID aus der URL auslesen (z.B. aus /deine-domain.ch/12345)
    const articleId = params.id;

    // 2. Den spezifischen Artikel aus der Datenbank holen
    const article = await db.getArticleById(articleId);

    // 3. Fehlerbehandlung: Wenn es die ID nicht gibt, eine 404-Seite werfen
    if (!article) {
        throw error(404, {
            message: 'Dieser Artikel wurde nicht gefunden.'
        });
    }

    // 4. Metadaten laden, um IDs in Klartext übersetzen zu können
    const categories = await db.getCategories();
    const attributes = await db.getFilterAttributes();

    // 5. Alles an das Frontend (+page.svelte) übergeben
    return {
        article,
        categories,
        attributes
    };
}