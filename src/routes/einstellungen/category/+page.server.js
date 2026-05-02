import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function load() {
    // Wir laden jetzt Kategorien UND die Attribut-Bibliothek parallel
    const categories = await db.getCategories();
    const filterAttributes = await db.getFilterAttributes();
    
    return {
        categories,
        filterAttributes
    };
}

export const actions = {
    // Action 1: Hauptkategorie erstellen
    createMain: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name');

        if (!name) {
            return fail(400, { errorMain: "Bitte einen Namen für die Hauptkategorie eingeben." });
        }

        try {
            await db.createMainCategory(name.trim());
            return { successMain: true };
        } catch (error) {
            return fail(500, { errorMain: "Datenbankfehler beim Speichern." });
        }
    },

    // Action 2: Unterkategorie erstellen
    createSub: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subName = data.get('subName');

        if (!mainId || !subName) {
            return fail(400, { errorSub: "Daten unvollständig." });
        }

        try {
            await db.createSubcategory(mainId, subName.trim());
            return { successSub: true };
        } catch (error) {
            return fail(500, { errorSub: "Datenbankfehler beim Speichern der Unterkategorie." });
        }
    },

    updateAttributes: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subId = data.get('subId');
        
        // getAll holt alle Checkboxen mit dem Namen 'attributes', die angeklickt wurden
        const attributeIds = data.getAll('attributes');

        if (!mainId || !subId) {
            return fail(400, { errorAttr: "IDs fehlen." });
        }

        try {
            await db.updateSubcategoryAttributes(mainId, subId, attributeIds);
            return { successAttr: true };
        } catch (error) {
            return fail(500, { errorAttr: "Fehler beim Zuweisen der Attribute in der DB." });
        }
    },

    renameMain: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const newName = data.get('newName');

        if (!id || !newName) return fail(400, { errorRename: "Daten fehlen." });

        try {
            await db.renameMainCategory(id, newName.trim());
            return { successRename: true };
        } catch (error) {
            return fail(500, { errorRename: "Fehler beim Umbenennen in der Datenbank." });
        }
    }

};