// src/routes/artikel-hinzufuegen/+page.server.js
import db from '$lib/server/db.js';
import { writeFileSync } from 'fs'; // Node.js Modul für das Dateisystem
import { extname } from 'path';     // Node.js Modul, um die Dateiendung (z.B. .jpg) herauszufinden

export async function load() {
    const categories = await db.getCategories();
    const attributes = await db.getFilterAttributes();
    
    return {
        categories,
        attributes
    };
}

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        
        // ... (Dein bisheriger Code zum Auslesen von Kategorien etc. bleibt gleich)
        const mainCategoryId = formData.get('mainCategoryId');
        const subcategoryId = formData.get('subcategoryId');
        const title = formData.get('title');
        const description = formData.get('description');
        const stock = parseInt(formData.get('stock'), 10) || 0; 
        const minStock = formData.get('minStock') ? parseInt(formData.get('minStock'), 10) : null;
        const supplier = formData.get('supplier');
        const orderLink = formData.get('orderLink');
        const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
        
        // --- NEU: BILDVERARBEITUNG ---
        const imageFile = formData.get('image');
        let imagePath = null; // Standardmäßig null, falls kein Bild hochgeladen wird

        // Prüfen, ob eine Datei hochgeladen wurde und ob sie eine Größe hat
        if (imageFile && imageFile.size > 0) {
            // 1. Dateiendung herausfinden (z.B. ".png")
            const ext = extname(imageFile.name);
            
            // 2. Einen eindeutigen Namen generieren (z.B. "article_1694523412.png")
            const filename = `article_${Date.now()}${ext}`;
            
            // 3. Den Speicherpfad auf dem Server definieren
            const uploadPath = `static/uploads/${filename}`;
            
            // 4. Die Datei aus dem formData in einen Puffer (Buffer) umwandeln und speichern
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            writeFileSync(uploadPath, buffer);
            
            // 5. Den Pfad für die Datenbank speichern (ohne "static", da das fürs Frontend der Root-Ordner / ist)
            imagePath = `/uploads/${filename}`;
        }
        // -----------------------------

        const articleAttributes = {};
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('attr_') && value.trim() !== '') {
                const attributeId = key.replace('attr_', '');
                articleAttributes[attributeId] = value.trim();
            }
        }
        
        const newArticle = {
            mainCategoryId,
            subcategoryId,
            title,
            description,
            stock,
            minStock,
            supplier,
            orderLink,
            price,
            imagePath, // <--- HIER übergeben wir den Bildpfad an die Datenbank
            attributes: articleAttributes,
            createdAt: new Date()
        };
        
        try {
            await db.createArticle(newArticle);
            return { success: true, message: 'Artikel erfolgreich gespeichert!' };
        } catch (error) {
            console.error("Fehler beim Speichern des Artikels:", error);
            return { success: false, error: 'Fehler beim Speichern in der Datenbank.' };
        }
    }
};