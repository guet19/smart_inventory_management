import { json } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        const { html, url, expectedAttributes } = await request.json();

        if (!html) return json({ error: 'Kein HTML empfangen.' }, { status: 400 });

        const $ = cheerio.load(html);
        
        // 1. Manuelle Bild-Suche (Meta-Tags sind bei Shops am sichersten)
        let manualImageUrl = $('meta[property="og:image"]').attr('content') 
                          || $('meta[name="twitter:image"]').attr('content')
                          || $('img').not('header img, footer img').first().attr('src');

        // 2. HTML bereinigen
        $('script, style, nav, footer, header, noscript, svg, iframe').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);

        // 3. KI initialisieren
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        });

        // 4. Der korrigierte, vollständige Prompt
        const prompt = `
            Du bist ein technischer Assistent. Der Benutzer hat bereits eine Kategorie ausgewählt. 
            Extrahiere die Artikeldaten und versuche, Werte für diese spezifischen Attribute zu finden:
            ${JSON.stringify(expectedAttributes)}

            Antworte strikt im JSON-Format. Nutze die Attribut-IDs exakt als Keys im "specs" Objekt.
            
            {
                "title": "Präziser Produktname",
                "description": "Hilfreiche Beschreibung (max. 3 Sätze)",
                "supplier": "Name des Shops oder Herstellers",
                "price": 12.50,
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
        
        // Absolute URL sicherstellen
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