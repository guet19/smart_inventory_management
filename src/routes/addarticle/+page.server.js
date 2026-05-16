import db from '$lib/server/db.js';
import { writeFile } from 'fs/promises'; 
import { extname } from 'path';

export async function load() {
    const categories = await db.getCategories();
    const attributes = await db.getFilterAttributes();
    
    return { categories, attributes };
}

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        
        // --- 1. Serverseitige Basis-Validierung ---
        const title = formData.get('title');
        const mainCategoryId = formData.get('mainCategoryId');
        
        if (!title || !mainCategoryId) {
            return { success: false, error: 'Titel und Hauptkategorie sind Pflichtfelder.' };
        }

        // --- 2. Allgemeine Standardwerte ---
        const subcategoryId = formData.get('subcategoryId');
        const description = formData.get('description');
        const stock = parseInt(formData.get('stock'), 10) || 0; 
        const minStock = formData.get('minStock') ? parseInt(formData.get('minStock'), 10) : null;
        const supplier = formData.get('supplier');
        const orderLink = formData.get('orderLink');
        const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
        
        // --- 3. BILDVERARBEITUNG (Asynchron & Abgesichert) ---
        const imageFile = formData.get('image');
        let imagePath = null; 

        if (imageFile && imageFile.size > 0) {
            // Security: Nur echte Bilder zulassen
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(imageFile.type)) {
                return { success: false, error: 'Nur JPG, PNG und WEBP Bilder sind erlaubt.' };
            }

            const ext = extname(imageFile.name) || `.${imageFile.type.split('/')[1]}`;
            const filename = `article_${Date.now()}${ext}`;
            const uploadPath = `static/uploads/${filename}`;
            
            try {
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                await writeFile(uploadPath, buffer);
                imagePath = `/uploads/${filename}`;
            } catch (fsError) {
                console.error("Fehler beim Speichern des Bildes:", fsError);
                return { success: false, error: 'Das Bild konnte nicht gespeichert werden.' };
            }
        }

        // --- 4. DYNAMISCHE ATTRIBUTE MIT ARRAY-SUPPORT ---
        const attributesSchema = await db.getFilterAttributes();
        const articleAttributes = {};
        
        for (const attr of attributesSchema) {
            const fieldName = `attr_${attr._id}`;
            
            if (formData.has(fieldName)) {
                const values = formData.getAll(fieldName)
                    .map(v => String(v).trim())
                    .filter(v => v !== '');
                
                if (values.length > 0) {
                    articleAttributes[attr._id] = attr.is_multiple ? values : values[0];
                }
            }
        }
        
        // --- 5. Finales Artikel-Objekt ---
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
        
        // --- 6. Datenbank-Speicherung ---
        try {
            await db.createArticle(newArticle);
            return { success: true, message: 'Artikel erfolgreich gespeichert!' };
        } catch (error) {
            console.error("Fehler beim Speichern des Artikels in DB:", error);
            return { success: false, error: 'Fehler beim Speichern in der Datenbank.' };
        }
    }
};