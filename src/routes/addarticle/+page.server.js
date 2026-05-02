// src/routes/artikel-hinzufuegen/+page.server.js
import db from '$lib/server/db.js';
import { writeFileSync } from 'fs'; 
import { extname } from 'path';     

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
        
        // 1. Kategorien
        const mainCategoryId = formData.get('mainCategoryId');
        const subcategoryId = formData.get('subcategoryId');

        // 2. Allgemeine Standardwerte
        const title = formData.get('title');
        const description = formData.get('description');
        const stock = parseInt(formData.get('stock'), 10) || 0; 
        const minStock = formData.get('minStock') ? parseInt(formData.get('minStock'), 10) : null;
        const supplier = formData.get('supplier');
        const orderLink = formData.get('orderLink');
        const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
        
        // 3. BILDVERARBEITUNG
        const imageFile = formData.get('image');
        let imagePath = null; 

        if (imageFile && imageFile.size > 0) {
            const ext = extname(imageFile.name);
            const filename = `article_${Date.now()}${ext}`;
            const uploadPath = `static/uploads/${filename}`;
            
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            writeFileSync(uploadPath, buffer);
            
            imagePath = `/uploads/${filename}`;
        }

        // 4. DYNAMISCHE ATTRIBUTE MIT ARRAY-SUPPORT (Multi-Select)
        // Wir laden die Schema-Struktur aus der DB, um zu wissen, ob ein Attribut is_multiple=true hat
        const attributesSchema = await db.getFilterAttributes();
        const articleAttributes = {};
        
        for (const attr of attributesSchema) {
            const fieldName = `attr_${attr._id}`;
            
            // formData.getAll() holt ALLE Werte eines Feldes als Array
            if (formData.has(fieldName)) {
                // Leere Strings herausfiltern und Leerzeichen trimmen
                const values = formData.getAll(fieldName).map(v => String(v).trim()).filter(v => v !== '');
                
                if (values.length > 0) {
                    // Wenn is_multiple true ist, speichern wir das Array (z.B. ["Rot", "Blau"])
                    // Andernfalls speichern wir nur den allerersten Wert als String (z.B. "Vishay")
                    articleAttributes[attr._id] = attr.is_multiple ? values : values[0];
                }
            }
        }
        
        // 5. Finales Artikel-Objekt zusammenbauen
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
            imagePath,
            attributes: articleAttributes,
            createdAt: new Date()
        };
        
        // 6. In Datenbank speichern
        try {
            await db.createArticle(newArticle);
            return { success: true, message: 'Artikel erfolgreich gespeichert!' };
        } catch (error) {
            console.error("Fehler beim Speichern des Artikels:", error);
            return { success: false, error: 'Fehler beim Speichern in der Datenbank.' };
        }
    }
};