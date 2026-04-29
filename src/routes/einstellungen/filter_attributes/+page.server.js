import { fail } from '@sveltejs/kit';
import db from '$lib/server/db.js'; 

export async function load() {
    // ... (Dein bisheriger Load-Code bleibt exakt gleich)
    let attributes = [];
    try {
        const collection = db.getDb().collection("filter_attributes");
        attributes = await collection.find({}).toArray();
        attributes = attributes.map(attr => ({
            ...attr,
            _id: attr._id.toString()
        }));
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
        
        // NEU: Wir lesen aus, ob es eine Mehrfachauswahl ist (gibt 'true' oder null zurück)
        const is_multiple = data.get('is_multiple') === 'true';
        
        const optionsRaw = data.get('options') || "";
        const options = optionsRaw.split(',')
            .map(opt => opt.trim())
            .filter(opt => opt !== "");

        if (!label || !ui_type) {
            return fail(400, { error: "Anzeigename und Eingabetyp sind erforderlich." });
        }

        try {
            const collection = db.getDb().collection("filter_attributes");
            
            await collection.insertOne({
                label,
                ui_type,
                unit: unit || null,
                // NEU: Wir speichern das Feld is_multiple (nur bei select relevant)
                is_multiple: ui_type === 'select' ? is_multiple : false,
                options: ui_type === 'select' ? options : [],
                createdAt: new Date()
            });
            
            return { success: true };
        } catch (error) {
            return fail(500, { error: "Datenbankfehler beim Speichern." });
        }
    }
};