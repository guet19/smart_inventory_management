// src/routes/artikel-hinzufuegen/+page.server.js
import db from '$lib/server/db.js';

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

        // 2. Allgemeine Standardwerte auslesen
        const title = formData.get('title');
        const description = formData.get('description');
        // parseInt/parseFloat wandelt die Strings in echte Zahlen für die Datenbank um
        const stock = parseInt(formData.get('stock'), 10) || 0; 
        const minStock = formData.get('minStock') ? parseInt(formData.get('minStock'), 10) : null;
        const supplier = formData.get('supplier');
        const orderLink = formData.get('orderLink');
        const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
        
        // 3. Dynamische Attribute (Spezifikationen) sammeln
        const articleAttributes = {};
        
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('attr_') && value.trim() !== '') {
                const attributeId = key.replace('attr_', '');
                articleAttributes[attributeId] = value.trim();
            }
        }
        
        // 4. Das finale Artikel-Objekt zusammenbauen
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