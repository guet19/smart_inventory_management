import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js'; 

export async function load() {
    const attributeLibrary = await db.getFilterAttributes();
    return { attributeLibrary };
}

export const actions = {
    create: async ({ request }) => {
        // ... (Dein bisheriger create-Code bleibt exakt gleich)
        // ...
    },

    // NEU: Aktion zum Updaten eines bestehenden Attributs
    update: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id'); // Die ID des zu bearbeitenden Attributs
        const label = data.get('label');
        const ui_type = data.get('ui_type');
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',')
            .map(opt => opt.trim())
            .filter(opt => opt !== "");

        if (!id || !label || !ui_type) {
            return fail(400, { errorUpdate: "Wichtige Felder fehlen." });
        }

        try {
            await db.updateFilterAttribute(id, {
                label,
                ui_type,
                unit: unit || null,
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : []
            });
            return { successUpdate: true };
        } catch (error) {
            return fail(500, { errorUpdate: "Datenbankfehler beim Aktualisieren." });
        }
    },

    addOptionQuick: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const newOption = data.get('newOption');

        if (!id || !newOption) return fail(400, { errorQuick: "Daten fehlen." });

        try {
            await db.addOptionToFilterAttribute(id, newOption.trim());
            return { successQuickAdd: true };
        } catch (error) {
            return fail(500, { errorQuick: "Datenbankfehler." });
        }
    },

    // NEU: Quick-Remove Aktion
    removeOptionQuick: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const option = data.get('option');

        if (!id || !option) return fail(400, { errorQuick: "Daten fehlen." });

        try {
            await db.removeOptionFromFilterAttribute(id, option);
            return { successQuickRemove: true };
        } catch (error) {
            return fail(500, { errorQuick: "Datenbankfehler." });
        }
    }
};