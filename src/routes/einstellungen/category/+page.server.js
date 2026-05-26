import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js';

export async function load() {
    const [categories, filterAttributes, articles] = await Promise.all([
        db.getCategories(),
        db.getFilterAttributes(),
        db.getArticles()
    ]);
    
    return {
        categories,
        filterAttributes,
        articles
    };
}

export const actions = {
    createMain: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name');
        if (!name) return fail(400, { errorMain: "Bitte einen Namen eingeben." });

        try {
            const newId = await db.createMainCategory(name.trim());
            return { successMain: true, newId: newId ? newId.toString() : null };
        } catch (error) {
            return fail(500, { errorMain: "Datenbankfehler beim Speichern." });
        }
    },

    createSub: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subName = data.get('subName');
        if (!mainId || !subName) return fail(400, { errorSub: "Daten unvollständig." });

        try {
            await db.createSubcategory(mainId, subName.trim());
            return { successSub: true };
        } catch (error) {
            return fail(500, { errorSub: "Datenbankfehler beim Speichern." });
        }
    },

    deleteSub: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subId = data.get('subId');
        if (!mainId || !subId) return fail(400, { errorDelete: "IDs fehlen." });

        try {
            await db.deleteSubcategory(mainId, subId);
            return { successDelete: true };
        } catch (error) {
            return fail(500, { errorDelete: "Datenbankfehler beim Löschen." });
        }
    },

    deleteMain: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        if (!mainId) return fail(400, { errorDeleteMain: "ID fehlt." });

        try {
            await db.deleteMainCategory(mainId);
            return { successDeleteMain: true };
        } catch (error) {
            return fail(500, { errorDeleteMain: "Datenbankfehler beim Löschen." });
        }
    },

    bulkDeleteSubs: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subIds = data.getAll('subIds');

        if (!mainId || !subIds || subIds.length === 0) {
            return fail(400, { errorBulkDelete: "Daten für Massenlöschung unvollständig." });
        }

        try {
            for (const subId of subIds) {
                await db.deleteSubcategory(mainId, subId);
            }
            return { successBulkDelete: true };
        } catch (error) {
            return fail(500, { errorBulkDelete: "Fehler beim Massenlöschen." });
        }
    },

    updateAttributes: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subId = data.get('subId');
        const attributeIds = data.getAll('attributes');

        if (!mainId || !subId) return fail(400, { errorAttr: "IDs fehlen." });

        try {
            await db.updateSubcategoryAttributes(mainId, subId, attributeIds);
            return { successAttr: true };
        } catch (error) {
            return fail(500, { errorAttr: "Fehler beim Zuweisen." });
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
            return fail(500, { errorRename: "Fehler beim Umbenennen." });
        }
    },

    // NEU: Action zum Umbenennen der Unterkategorie
    renameSub: async ({ request }) => {
        const data = await request.formData();
        const mainId = data.get('mainId');
        const subId = data.get('subId');
        const newName = data.get('newName');

        if (!mainId || !subId || !newName) return fail(400, { errorRenameSub: "Daten fehlen." });

        try {
            await db.renameSubcategory(mainId, subId, newName.trim());
            return { successRenameSub: true };
        } catch (error) {
            return fail(500, { errorRenameSub: "Fehler beim Umbenennen der Unterkategorie." });
        }
    }
};