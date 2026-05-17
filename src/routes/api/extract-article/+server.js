// src/routes/api/extract-article/+server.js
import { json } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        // Empfange HTML, URL und die Liste deiner Kategorien vom Frontend
        const { html, url, availableCategories } = await request.json();

        if (!html) {
            return json({ error: 'Kein Inhalt zur Analyse empfangen.' }, { status: 400 });
        }

        // 1. HTML mit Cheerio bereinigen (entfernt unnötigen Code-Ballast)
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header, noscript, svg, iframe').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);

        // 2. Gemini initialisieren (Nutzt dein API-Key aus der .env Datei)
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.1 
            }
        });

        // 3. Der Prompt: Hier weisen wir die KI an, deine Kategorien zu nutzen
        const prompt = `
            Du bist ein technischer Assistent für ein digitales Kleinteilelager. 
            Extrahiere aus dem folgenden Text der Produktseite die wichtigsten Artikeldaten.
            
            Wähle aus der Liste der verfügbaren Kategorien die passendste Hauptkategorie aus und gib NUR deren ID zurück.
            Verfügbare Kategorien in meinem System:
            ${JSON.stringify(availableCategories)}

            Antworte strikt im JSON-Format:
            {
                "title": "Präziser Produktname",
                "description": "Hilfreiche Beschreibung (max. 3 Sätze)",
                "supplier": "Name des Shops oder Herstellers",
                "price": 12.50,
                "categoryId": "DIE_PASSENDE_ID_AUS_DER_OBIGEN_LISTE",
                "specs": {
                    "Eigenschaft": "Wert"
                }
            }
            
            URL der Quelle: ${url}
            Text zum Analysieren:
            ${cleanText}
        `;

        // 4. KI-Anfrage ausführen
        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text();
        
        // Bereinigung von eventuellen Markdown-Blöcken
        aiResponseText = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const extractedData = JSON.parse(aiResponseText);
        
        return json(extractedData);

    } catch (error) {
        console.error("Fehler im Backend:", error);
        return json({ 
            error: 'Fehler beim Analysieren der Daten.',
            details: error.message 
        }, { status: 500 });
    }
}