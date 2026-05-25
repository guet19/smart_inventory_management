// src/routes/api/extract-article/+server.js
import { json } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        const { html, url, expectedAttributes } = await request.json();

        if (!html) return json({ error: 'Kein HTML empfangen.' }, { status: 400 });

        const $ = cheerio.load(html);
        
        let manualImageUrl = $('meta[property="og:image"]').attr('content') 
                          || $('meta[name="twitter:image"]').attr('content')
                          || $('img').not('header img, footer img').first().attr('src');

        $('script, style, nav, footer, header, noscript, svg, iframe').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        });

        const prompt = `
            Du bist ein technischer Assistent. Der Benutzer hat bereits eine Kategorie ausgewählt. 
            Extrahiere die Artikeldaten und versuche, Werte für diese spezifischen Attribute zu finden:
            ${JSON.stringify(expectedAttributes)}

            WICHTIGE REGELN:
            1. TITEL: Generiere einen sauberen, professionellen Artikelnamen für ein lokales Lagermanagement-System. Entferne zwingend alle Shop-Namen (wie 'kaufen bei JUMBO'), SEO-Begriffe und Packungsgrössen/Stückzahlen (z.B. '| 100 Stück'), da das System die Artikel als Einzelstücke verwaltet.
            2. PREIS: Wenn der Artikel in einer Packung verkauft wird (z.B. '100 Stück'), fülle "totalPackPrice" (Gesamtpreis der Packung) und "packQuantity" (Stückzahl als Zahl) aus. Bei Einzelartikeln fülle nur "price" aus.
            3. GTIN/EAN: Suche im Text nach einer GTIN, EAN, Barcode-Nummer oder einer eindeutigen Artikelnummer des Herstellers. Falls gefunden, trage sie in das Feld "gtin" ein.
            4. ZAHLEN & EINHEITEN (EXTREM WICHTIG): Wenn ein Attribut in der JSON-Liste den "ui_type": "number" hat, antworte AUSSCHLIESSLICH mit der nackten Zahl (Dezimalstellen mit Punkt). Entferne jeglichen Text und alle Einheiten (z.B. 'mm', 'W', 'kg', 'cm', 'V', 'Stück') komplett aus deiner Antwort!
               FALSCH: "20 mm" -> RICHTIG: "20"
               FALSCH: "15.5 Watt" -> RICHTIG: "15.5"

            Antworte strikt im JSON-Format. Nutze die Attribut-IDs exakt als Keys im "specs" Objekt.
            
            {
                "title": "Sauberer, bereinigter Produktname",
                "description": "Hilfreiche Beschreibung (max. 3 Sätze)",
                "supplier": "Name des Herstellers (nicht des Shops)",
                "gtin": "7611123456789",
                "price": 12.50,
                "totalPackPrice": 6.20,
                "packQuantity": 100,
                "specs": {
                    "ID_DES_ATTRIBUTS": "Gefundener Wert"
                },
                "finalImageUrl": "${manualImageUrl || ''}" 
            }
            
            URL: ${url}
            Text: ${cleanText}
        `;

        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedData = JSON.parse(aiResponseText);
        
        if (extractedData.finalImageUrl && extractedData.finalImageUrl.startsWith('/')) {
            const urlObj = new URL(url);
            extractedData.finalImageUrl = `${urlObj.origin}${extractedData.finalImageUrl}`;
        }
        
        return json(extractedData);

    } catch (error) {
        console.error("Fehler im Backend:", error);
        return json({ error: 'Fehler beim Analysieren' }, { status: 500 });
    }
}