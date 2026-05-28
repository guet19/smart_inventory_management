import db from '$lib/server/db.js';
import { error, redirect } from '@sveltejs/kit';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

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

    // 4. Metadaten für die Dropdowns laden
    const categories = await db.getCategories();
    const attributes = await db.getFilterAttributes();

    // 5. Alles "entschärft" an das Frontend (+page.svelte) übergeben
    return {
        article: JSON.parse(JSON.stringify(article)),
        categories: JSON.parse(JSON.stringify(categories)),
        attributes: JSON.parse(JSON.stringify(attributes))
    };
}

export const actions = {
    update: async ({ request, params }) => {
        const formData = await request.formData();
        const articleId = params.id;
        
        // Alten Artikel holen (wir brauchen diesen für den alten Bildpfad)
        const oldArticle = await db.getArticleById(articleId);
        if (!oldArticle) {
            return { error: "Artikel nicht gefunden." };
        }

        // Standard-Daten aus dem Formular auslesen
        let updateData = {
            title: formData.get("title")?.toString().trim() || "",
            description: formData.get("description")?.toString().trim() || "",
            mainCategoryId: formData.get("mainCategoryId")?.toString() || "",
            subcategoryId: formData.get("subcategoryId")?.toString() || "",
            supplier: formData.get("supplier")?.toString().trim() || "",
            gtin: formData.get("gtin")?.toString().trim() || "",
            orderLink: formData.get("orderLink")?.toString().trim() || "",
            updatedAt: new Date()
        };

        // Zahlen sicher parsen
        const priceStr = formData.get("price");
        updateData.price = priceStr ? parseFloat(priceStr) : null;

        const istBestandStr = formData.get("istBestand");
        updateData.istBestand = istBestandStr ? parseInt(istBestandStr, 10) : 0;

        const sollBestandStr = formData.get("sollBestand");
        updateData.sollBestand = sollBestandStr ? parseInt(sollBestandStr, 10) : null;

        const mindestBestandStr = formData.get("mindestBestand");
        updateData.mindestBestand = mindestBestandStr ? parseInt(mindestBestandStr, 10) : null;

        // Dynamische Spezifikationen auslesen (alle Keys, die mit "attr_" beginnen)
        const attributesMap = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("attr_")) {
                const attrId = key.replace("attr_", "");
                // formData.getAll greift Array-Werte von Multi-Selects ab
                const allValues = formData.getAll(key);
                attributesMap[attrId] = allValues.length > 1 ? allValues : value.toString();
            }
        }
        updateData.attributes = attributesMap;

        // --- BILDVERARBEITUNG ---
        const removeExistingImage = formData.get("removeExistingImage") === "true";
        const newImageFile = formData.get("image");

        // 1. Altes Bild physisch löschen (wenn der Nutzer es entfernt ODER ein neues hochlädt)
        if ((removeExistingImage || (newImageFile && newImageFile.size > 0)) && oldArticle.imagePath) {
            try {
                // Den absoluten Dateipfad zusammenbauen
                const oldFilePath = path.join(process.cwd(), 'static', oldArticle.imagePath);
                if (existsSync(oldFilePath)) {
                    unlinkSync(oldFilePath); // Bild löschen
                }
            } catch (e) {
                console.error("Altes Bild konnte nicht physisch gelöscht werden:", e);
            }
            // Temporär auf null setzen, falls kein neues Bild mehr kommt
            updateData.imagePath = null;
        }

        // 2. Neues Bild speichern
        if (newImageFile && newImageFile.size > 0 && newImageFile.name !== 'undefined') {
            // Einen eindeutigen Namen generieren (Timestamp + Random)
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
            const filePath = path.join(process.cwd(), 'static', 'uploads', fileName);
            
            // Datei auf dem Server ablegen
            const buffer = Buffer.from(await newImageFile.arrayBuffer());
            writeFileSync(filePath, buffer);
            
            // Pfad für die Datenbank setzen
            updateData.imagePath = `/uploads/${fileName}`;
        }

        // In die Datenbank schreiben
        try {
            await db.updateArticle(articleId, updateData);
            return { success: true };
        } catch (err) {
            console.error("Datenbank Update-Fehler:", err);
            return { error: "Fehler beim Speichern der Änderungen in der Datenbank." };
        }
    },

    delete: async ({ params }) => {
        const articleId = params.id;
        const oldArticle = await db.getArticleById(articleId);

        // Auch beim Löschen des Artikels räumen wir das Bild vom Server auf
        if (oldArticle && oldArticle.imagePath) {
            try {
                const oldFilePath = path.join(process.cwd(), 'static', oldArticle.imagePath);
                if (existsSync(oldFilePath)) {
                    unlinkSync(oldFilePath);
                }
            } catch (e) {
                console.error("Bild konnte beim Löschen des Artikels nicht entfernt werden:", e);
            }
        }

        try {
            // HINWEIS: Du brauchst in deiner db.js eine "deleteArticle"-Funktion!
            await db.deleteArticle(articleId); 
        } catch (err) {
            console.error("Fehler beim Löschen des Artikels:", err);
            return { error: "Fehler beim Löschen." };
        }

        // Bei Erfolg werfen wir den Nutzer direkt zurück auf die Startseite
        throw redirect(303, "/");
    }
};