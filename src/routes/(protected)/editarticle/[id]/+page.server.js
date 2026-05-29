// src/routes/(protected)/editarticle/[id]/+page.server.js
import db from '$lib/server/db.js';
import { error, redirect } from '@sveltejs/kit';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

export async function load({ params, cookies }) {
    // 1. Nutzer identifizieren
    const userId = cookies.get('session');
    if (!userId) {
        throw error(401, 'Nicht autorisiert');
    }

    const articleId = params.id;

    // 2. Artikel mit Sicherheitscheck (userId) aus der DB holen
    const article = await db.getArticleById(userId, articleId);

    // 3. Fehlerbehandlung: Wenn es die ID nicht gibt oder sie nicht dem User gehört
    if (!article) {
        throw error(404, {
            message: 'Dieser Artikel wurde nicht gefunden oder du hast keinen Zugriff darauf.'
        });
    }

    // 4. Metadaten für die Dropdowns laden (ebenfalls gefiltert!)
    const categories = await db.getCategories(userId);
    const attributes = await db.getFilterAttributes(userId);

    return {
        article: JSON.parse(JSON.stringify(article)),
        categories: JSON.parse(JSON.stringify(categories)),
        attributes: JSON.parse(JSON.stringify(attributes))
    };
}

export const actions = {
    update: async ({ request, params, cookies }) => {
        // Sicherheitscheck
        const userId = cookies.get('session');
        if (!userId) return { error: "Nicht autorisiert" };

        const formData = await request.formData();
        const articleId = params.id;
        
        // Alten Artikel prüfen (Gehört er dem User?)
        const oldArticle = await db.getArticleById(userId, articleId);
        if (!oldArticle) {
            return { error: "Artikel nicht gefunden oder Zugriff verweigert." };
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
                const allValues = formData.getAll(key);
                attributesMap[attrId] = allValues.length > 1 ? allValues : value.toString();
            }
        }
        updateData.attributes = attributesMap;

        // --- BILDVERARBEITUNG ---
        const removeExistingImage = formData.get("removeExistingImage") === "true";
        const newImageFile = formData.get("image");

        if ((removeExistingImage || (newImageFile && newImageFile.size > 0)) && oldArticle.imagePath) {
            try {
                const oldFilePath = path.join(process.cwd(), 'static', oldArticle.imagePath);
                if (existsSync(oldFilePath)) {
                    unlinkSync(oldFilePath);
                }
            } catch (e) {
                console.error("Altes Bild konnte nicht physisch gelöscht werden:", e);
            }
            updateData.imagePath = null;
        }

        if (newImageFile && newImageFile.size > 0 && newImageFile.name !== 'undefined') {
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000)}.jpg`;
            const filePath = path.join(process.cwd(), 'static', 'uploads', fileName);
            
            const buffer = Buffer.from(await newImageFile.arrayBuffer());
            writeFileSync(filePath, buffer);
            
            updateData.imagePath = `/uploads/${fileName}`;
        }

        // Update in der DB (Sicherheitscheck passiert in db.js via userId)
        try {
            await db.updateArticle(userId, articleId, updateData);
            return { success: true };
        } catch (err) {
            console.error("Datenbank Update-Fehler:", err);
            return { error: "Fehler beim Speichern der Änderungen in der Datenbank." };
        }
    },

    delete: async ({ params, cookies }) => {
        // Sicherheitscheck
        const userId = cookies.get('session');
        if (!userId) return { error: "Nicht autorisiert" };

        const articleId = params.id;
        
        // Zuerst prüfen, ob der Nutzer diesen Artikel überhaupt löschen darf
        const oldArticle = await db.getArticleById(userId, articleId);
        if (!oldArticle) {
            return { error: "Artikel nicht gefunden oder Zugriff verweigert." };
        }

        // Bild vom Server aufräumen
        if (oldArticle.imagePath) {
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
            // ACHTUNG: Die db.deleteArticle Funktion fehlt bisher noch in deiner db.js!
            // Du musst sie dort noch ergänzen (siehe Block unten)
            await db.deleteArticle(userId, articleId); 
        } catch (err) {
            console.error("Fehler beim Löschen des Artikels:", err);
            return { error: "Fehler beim Löschen." };
        }

        throw redirect(303, "/");
    }
};