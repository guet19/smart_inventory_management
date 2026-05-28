import db from '$lib/server/db.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    // 1. Die ID aus der URL auslesen
    const articleId = params.id;

    // 2. Den spezifischen Artikel aus der Datenbank holen
    const article = await db.getArticleById(articleId);

    // 3. Fehlerbehandlung: Wenn es die ID nicht gibt, eine 404-Seite werfen
    if (!article) {
        throw error(404, {
            message: 'Dieser Artikel wurde nicht gefunden.'
        });
    }

    // 4. Metadaten laden
    const categories = await db.getCategories();
    const attributes = await db.getFilterAttributes();

    // 5. Alles "entschärft" an das Frontend (+page.svelte) übergeben
    return {
        article: JSON.parse(JSON.stringify(article)),
        categories: JSON.parse(JSON.stringify(categories)),
        attributes: JSON.parse(JSON.stringify(attributes))
    };
}

// --- NEU: Action für das Speichern des Bestandes ---
export const actions = {
    updateStock: async ({ request }) => {
        // Daten aus dem Frontend-Formular abfangen
        const data = await request.formData();
        const articleId = data.get('articleId');
        const newStock = parseInt(data.get('newStock'), 10);

        // Sicherheitsprüfung
        if (isNaN(newStock) || newStock < 0) {
            return { success: false, error: 'Ungültiger Bestand' };
        }

        try {
            // Hier greifen wir auf deine Datenbank zu, um den Wert zu überschreiben.
            // HINWEIS: Stelle sicher, dass du in deiner '$lib/server/db.js' 
            // eine entsprechende Update-Funktion hast. 
            // Falls sie anders heißt (z.B. updateArticleStock), passe den Namen hier an:
            
            await db.updateArticle(articleId, { istBestand: newStock });

            return { success: true };
        } catch (err) {
            console.error("Fehler beim Aktualisieren des Bestandes:", err);
            return { success: false, error: "Bestand konnte nicht gespeichert werden." };
        }
    }
};