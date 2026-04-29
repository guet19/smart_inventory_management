import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js'; 

export async function load() {
    let attributes = [];
    try {
        attributes = await db.getFilterAttributes();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
    }
    return { attributeLibrary: attributes };
}

export const actions = {
    create: async ({ request }) => {
        const data = await request.formData();
        const label = data.get('label')?.trim();
        const ui_type = data.get('ui_type');
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt !== "");

        if (!label || !ui_type) {
            return fail(400, { error: "Anzeigename und Eingabetyp sind erforderlich." });
        }

        const existingAttr = await db.getFilterAttributeByLabel(label);
        if (existingAttr) {
            return fail(400, { error: `Ein Attribut mit dem Namen "${label}" existiert bereits.` });
        }

        try {
            await db.createFilterAttribute({
                label, ui_type, unit: unit || null,
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : [],
                createdAt: new Date()
            });
            // HIER sendet der Server das Erfolgs-Signal und die Nachricht:
            return { success: true, message: `Attribut "${label}" erfolgreich angelegt!` };
        } catch (error) {
            return fail(500, { error: "Datenbankfehler beim Speichern." });
        }
    },

    update: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const label = data.get('label')?.trim();
        const ui_type = data.get('ui_type');
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt !== "");

        if (!id || !label || !ui_type) {
            return fail(400, { error: "ID, Name und Typ sind erforderlich." });
        }

        const existingAttr = await db.getFilterAttributeByLabel(label);
        if (existingAttr && existingAttr._id.toString() !== id) {
            return fail(400, { error: `Ein anderes Attribut mit dem Namen "${label}" existiert bereits.` });
        }

        try {
            await db.updateFilterAttribute(id, {
                label, ui_type, unit: unit || null,
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : [],
                updatedAt: new Date()
            });
            // HIER sendet der Server das Erfolgs-Signal und die Nachricht:
            return { success: true, message: `Attribut "${label}" erfolgreich aktualisiert!` };
        } catch (error) {
            return fail(500, { error: "Fehler beim Aktualisieren." });
        }
    },

    delete: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');

        if (!id) {
            return fail(400, { error: "Keine ID zum Löschen übergeben." });
        }

        try {
            await db.deleteFilterAttribute(id);
            // HIER sendet der Server das Erfolgs-Signal und die Nachricht:
            return { success: true, message: "Attribut erfolgreich gelöscht!" };
        } catch (error) {
            return fail(500, { error: "Datenbankfehler beim Löschen." });
        }
    }
};