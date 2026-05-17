// src/routes/addarticle/+page.server.js
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db'; 
import { ObjectId } from 'mongodb';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export async function load() {
    try {
        const categories = await db.collection('categories').find().toArray();
        const attributes = await db.collection('filter_attributes').find().toArray();

        return {
            categories: JSON.parse(JSON.stringify(categories)),
            attributes: JSON.parse(JSON.stringify(attributes))
        };
    } catch (e) {
        // Schau jetzt in dein VS Code Terminal (unten), dort steht die Lösung!
        console.error("--- DATENBANK FEHLER DIAGNOSE ---");
        console.error("Meldung:", e.message);
        console.error("Name:", e.name);
        console.error("---------------------------------");
        
        throw error(500, `Datenbank-Details: ${e.message}`);
    }
}

export const actions = {
    default: async ({ request }) => {
        const data = await request.formData();
        
        const title = data.get('title');
        const mainCategoryId = data.get('mainCategoryId');
        const stock = parseInt(data.get('stock') || "0");
        const imageFile = data.get('image');

        if (!title || !mainCategoryId) {
            return fail(400, { error: "Titel und Hauptkategorie sind erforderlich." });
        }

        try {
            let imagePath = null;

            // --- Sicherstellen, dass der Upload-Ordner existiert ---
            const uploadDir = join(process.cwd(), 'static', 'uploads');
            if (!existsSync(uploadDir)) {
                mkdirSync(uploadDir, { recursive: true });
            }

            // --- Bildverarbeitung ---
            if (imageFile && imageFile instanceof Blob && imageFile.size > 0) {
                const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
                const filePath = join(uploadDir, filename);
                
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                writeFileSync(filePath, buffer);
                imagePath = `/uploads/${filename}`;
            }

            const itemAttributes = {};
            for (const [key, value] of data.entries()) {
                if (key.startsWith('attr_') && value) {
                    const attrId = key.replace('attr_', '');
                    itemAttributes[attrId] = value;
                }
            }

            const newArticle = {
                title,
                description: data.get('description'),
                mainCategoryId: new ObjectId(mainCategoryId),
                subcategoryId: data.get('subcategoryId') || null,
                stock,
                supplier: data.get('supplier'),
                price: parseFloat(data.get('price') || "0"),
                orderLink: data.get('orderLink'),
                imagePath,
                attributes: itemAttributes,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection('articles').insertOne(newArticle);

            return { success: true, message: "Artikel erfolgreich gespeichert!" };
            
        } catch (e) {
            console.error("Speicherfehler:", e);
            return fail(500, { error: "Fehler beim Speichern in der Datenbank." });
        }
    }
};