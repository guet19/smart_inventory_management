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
        // Konsolen-Ausgabe für einfacheres Debugging
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
        
        // 1. Basis-Daten auslesen
        const title = data.get('title');
        const mainCategoryId = data.get('mainCategoryId');
        
        // Den rohen Ist-Bestand für die Pflichtfeld-Prüfung auslesen
        const istBestandRaw = data.get('istBestand');
        
        const imageFile = data.get('image');

        // 2. Server-seitige Pflichtfeld-Validierung (inklusive Ist-Bestand)
        if (!title || !mainCategoryId || istBestandRaw === null || istBestandRaw === '') {
            return fail(400, { error: "Titel, Hauptkategorie und Ist-Bestand sind erforderlich." });
        }

        try {
            // 3. Bestände sauber in Zahlen (Integer) umwandeln
            const istBestand = parseInt(istBestandRaw, 10);
            
            // Wenn Soll- oder Mindestbestand leer sind, speichern wir 'null'
            const sollBestand = data.get('sollBestand') ? parseInt(data.get('sollBestand'), 10) : null;
            const mindestBestand = data.get('mindestBestand') ? parseInt(data.get('mindestBestand'), 10) : null;

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

            // --- Dynamische Attribute auslesen ---
            const itemAttributes = {};
            for (const [key, value] of data.entries()) {
                if (key.startsWith('attr_') && value) {
                    const attrId = key.replace('attr_', '');
                    itemAttributes[attrId] = value;
                }
            }

            // --- Das fertige Datenbank-Objekt zusammensetzen ---
            const newArticle = {
                title,
                description: data.get('description'),
                mainCategoryId: new ObjectId(mainCategoryId),
                subcategoryId: data.get('subcategoryId') || null,
                
                // Hier werden die drei Bestands-Kategorien gespeichert
                istBestand,
                sollBestand,
                mindestBestand,
                
                supplier: data.get('supplier'),
                price: parseFloat(data.get('price') || "0"), // Der (evtl. berechnete) Stückpreis
                orderLink: data.get('orderLink'),
                imagePath,
                attributes: itemAttributes,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // In MongoDB speichern
            await db.collection('articles').insertOne(newArticle);

            return { success: true, message: "Artikel erfolgreich gespeichert!" };
            
        } catch (e) {
            console.error("Speicherfehler:", e);
            return fail(500, { error: "Fehler beim Speichern in der Datenbank." });
        }
    }
};