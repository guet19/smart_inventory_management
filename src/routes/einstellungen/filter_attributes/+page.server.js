import { fail } from '@sveltejs/kit';
// Wir importieren das Standard-Export-Objekt aus deiner db.js
import db from '$lib/server/db.js'; 

export async function load() {
    let attributes = [];
    try {
        // Wir nutzen jetzt deine fertige Hilfsfunktion! Kein .getDb() mehr nötig.
        attributes = await db.getFilterAttributes();
    } catch (error) {
        console.error("Fehler beim Laden:", error);
    }
    return { attributeLibrary: attributes };
}

export const actions = {
    create: async ({ request }) => {
        const data = await request.formData();
        const label = data.get('label');
        const ui_type = data.get('ui_type');
        const unit = data.get('unit');
        
        const is_multiple = data.get('is_multiple') === 'true';
        
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',')
            .map(opt => opt.trim())
            .filter(opt => opt !== "");

        if (!label || !ui_type) {
            return fail(400, { error: "Anzeigename und Eingabetyp sind erforderlich." });
        }

        try {
            // Wir übergeben das fertige Objekt direkt an deine neue Hilfsfunktion!
            await db.createFilterAttribute({
                label,
                ui_type,
                unit: unit || null,
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : [],
                createdAt: new Date()
            });
            
            return { success: true };
        } catch (error) {
            console.error("KRITISCHER DATENBANKFEHLER BEIM INSERT:", error);
            return fail(500, { error: "Datenbankfehler beim Speichern." });
        }
    },

    delete: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id'); // Wir holen uns die ID aus dem Formular

        if (!id) {
            return fail(400, { error: "Keine ID zum Löschen übergeben." });
        }

        try {
            await db.deleteFilterAttribute(id);
            return { success: true };
        } catch (error) {
            console.error("Fehler beim Löschen in der Action:", error);
            return fail(500, { error: "Datenbankfehler beim Löschen." });
        }
    },

    update: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const label = data.get('label');
        const ui_type = data.get('ui_type');
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt !== "");

        if (!id || !label || !ui_type) {
            return fail(400, { error: "ID, Name und Typ sind erforderlich." });
        }

        try {
            await db.updateFilterAttribute(id, {
                label,
                ui_type,
                unit: unit || null,
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : [],
                updatedAt: new Date()
            });
            return { success: true };
        } catch (error) {
            return fail(500, { error: "Fehler beim Aktualisieren." });
        }
    }
};