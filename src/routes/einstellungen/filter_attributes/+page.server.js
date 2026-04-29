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
        const label = data.get('label')?.trim(); // .trim() entfernt versehentliche Leerzeichen am Anfang/Ende
        const ui_type = data.get('ui_type');
        // ... (restliche Daten auslesen bleibt gleich)
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt !== "");

        if (!label || !ui_type) {
            return fail(400, { error: "Anzeigename und Eingabetyp sind erforderlich." });
        }

        // --- NEU: Validierung auf Duplikate beim Anlegen ---
        const existingAttr = await db.getFilterAttributeByLabel(label);
        if (existingAttr) {
            // Wenn etwas gefunden wurde, brechen wir ab und senden eine Fehlermeldung ans Frontend
            return fail(400, { 
                error: `Ein Attribut mit dem Namen "${label}" existiert bereits.` 
            });
        }

        try {
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

    update: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('id');
        const label = data.get('label')?.trim();
        const ui_type = data.get('ui_type');
        // ... (restliche Daten auslesen bleibt gleich)
        const unit = data.get('unit');
        const is_multiple = data.get('is_multiple') === 'true';
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt !== "");

        if (!id || !label || !ui_type) {
            return fail(400, { error: "ID, Name und Typ sind erforderlich." });
        }

        // --- NEU: Validierung auf Duplikate beim Bearbeiten ---
        const existingAttr = await db.getFilterAttributeByLabel(label);
        // WICHTIG: Beim Bearbeiten darf der Name existieren, ABER NUR, wenn es das Attribut selbst ist!
        // (Sonst könntest du ein Attribut nicht speichern, wenn du nur die Einheit änderst, aber den Namen gleich lässt).
        if (existingAttr && existingAttr._id.toString() !== id) {
            return fail(400, { 
                error: `Ein anderes Attribut mit dem Namen "${label}" existiert bereits.` 
            });
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
    },

    delete: async ({ request }) => {
        // ... (deine delete-Funktion bleibt exakt so wie sie ist)
        const data = await request.formData();
        const id = data.get('id');

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
    }
};