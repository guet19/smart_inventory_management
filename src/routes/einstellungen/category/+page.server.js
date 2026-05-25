// src/routes/kategorien/+page.server.js
import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function load() {
    // Wir laden Kategorien, Attribute UND Artikel parallel
    const [categories, filterAttributes, articles] = await Promise.all([
        db.getCategories(),
        db.getFilterAttributes(),
        db.getArticles() // NEU: Artikel laden für Frontend-Prüfung
    ]);
    
    return {
        categories,
        filterAttributes,
        articles
    };
}

export const actions = {
    // Action: Hauptkategorie erstellen
    createMain: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name');

        if (!name) {
            return fail(400, { errorMain: "Bitte einen Namen für die Hauptkategorie eingeben." });
        }

        try {
            // db.createMainCategory gibt die neue ID zurück fürs automatische Aufklappen im Frontend
            const newId = await db.createMainCategory(name.trim());
            return { successMain: true, newId: newId ? newId.toString() : null };
        } catch (error) {
            return fail(500, { errorMain: "Datenbankfehler beim Speichern." });
        }
    },

    // Action: Unterkategorie erstellen
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

    // Action: Einzelne Unterkategorie löschen
    deleteSub: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subId = data.get('subId');

        if (!mainId || !subId) {
            return fail(400, { errorDelete: "IDs für die Löschung fehlen." });
        }

        try {
            await db.deleteSubcategory(mainId, subId);
            return { successDelete: true };
        } catch (error) {
            return fail(500, { errorDelete: "Datenbankfehler beim Löschen der Unterkategorie." });
        }
    },

    // Action: Hauptkategorie löschen (NEU)
    deleteMain: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');

        if (!mainId) {
            return fail(400, { errorDeleteMain: "ID der Hauptkategorie fehlt." });
        }

        try {
            await db.deleteMainCategory(mainId);
            return { successDeleteMain: true };
        } catch (error) {
            return fail(500, { errorDeleteMain: "Datenbankfehler beim Löschen der Hauptkategorie." });
        }
    },

    // Action: Mehrere Unterkategorien löschen (Massenlöschung) (NEU)
    bulkDeleteSubs: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        
        // getAll holt alle Checkboxen mit dem Namen 'subIds', die angeklickt wurden
        const subIds = data.getAll('subIds');

        if (!mainId || !subIds || subIds.length === 0) {
            return fail(400, { errorBulkDelete: "Daten für Massenlöschung unvollständig." });
        }

        try {
            // Wir löschen die Unterkategorien nacheinander in der DB.
            // Effizienter wäre ein Bulk-Write, aber das reicht für den Anfang.
            for (const subId of subIds) {
                await db.deleteSubcategory(mainId, subId);
            }
            return { successBulkDelete: true };
        } catch (error) {
            return fail(500, { errorBulkDelete: "Fehler beim Massenlöschen in der Datenbank." });
        }
    },

    // Action: Attribute zuweisen
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

    // Action: Hauptkategorie umbenennen
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