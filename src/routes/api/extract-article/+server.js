// src/routes/api/extract-article/+server.js
import { json } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        const { html, url, expectedAttributes } = await request.json();

        if (!html) return json({ error: 'Kein Text/HTML empfangen.' }, { status: 400 });

        const $ = cheerio.load(html);
        
        let manualImageUrl = $('meta[property="og:image"]').attr('content') 
                          || $('meta[name="twitter:image"]').attr('content')
                          || $('img').not('header img, footer img, .icon img').first().attr('src');

        // --- OPTIMIERUNG 1: JSON-LD (Strukturierte Produktdaten) retten ---
        let jsonLdText = "";
        $('script[type="application/ld+json"]').each((_, el) => {
            jsonLdText += $(el).html() + " \n";
        });

        // Jetzt erst den HTML-Müll aufräumen
        $('script, style, nav, footer, header, noscript, svg, iframe').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);

        // Die KI bekommt nun die strukturierten Daten PLUS den sichtbaren Text
        const finalTextToAnalyze = `Versteckte Shop-Daten (JSON-LD):\n${jsonLdText}\n\nSichtbarer Webseiten-Text:\n${cleanText}`;

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");
        
        // --- OPTIMIERUNG 2: System-Instructions für striktere Regeleinhaltung ---
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: `Du bist ein technischer Daten-Extraktor für das lokale Lagermanagement-System "Sortify". 
Deine primäre Aufgabe ist es, Produktdaten präzise im JSON-Format zu extrahieren.

WICHTIGE REGELN:
1. TITEL: Generiere einen sauberen, professionellen Artikelnamen. Entferne zwingend alle Shop-Namen (z.B. 'kaufen bei...'), SEO-Begriffe und Packungsgrößen (z.B. '| 100 Stück'), da die Artikel als Einzelstücke verwaltet werden.
2. PREIS: Wenn der Artikel in einer Packung verkauft wird, fülle "totalPackPrice" (Gesamtpreis) und "packQuantity" (Stückzahl als Zahl) aus. Bei Einzelartikeln fülle nur "price" aus.
3. GTIN/EAN: Suche intensiv nach einer GTIN, EAN oder eindeutigen Herstellernummer und trage sie in "gtin" ein.
4. ZAHLEN & EINHEITEN: Wenn ein Attribut den "ui_type": "number" hat, antworte AUSSCHLIESSLICH mit der nackten Zahl (Dezimalstellen mit Punkt). Entferne jeglichen Text und Einheiten! (Richtig: "20", Falsch: "20 mm").
5. LIEFERANT / SHOP: Mit "supplier" ist zwingend der Name des Online-Shops gemeint, bei dem der Artikel gefunden wurde (z.B. "JUMBO", "Galaxus", "Brack"). Nutze die übergebenen Daten (URL, Shop-Tag), um diesen Namen abzuleiten. Trage den Shop-Namen in "supplier" ein. Die eigentliche Marke des Produkts (z.B. 'Spax' oder 'Bosch') ist hier FALSCH und darf nicht in dieses Feld.
6. FEHLENDE DATEN: Erfinde nichts. Was nicht im Text steht, wird als null zurückgegeben.`,
            generationConfig: { 
                responseMimeType: "application/json", 
                temperature: 0.1 
            }
        });

        // --- OPTIMIERUNG 3: Aufgeräumter User-Prompt ---
        const prompt = `
Hier sind die erwarteten Attribute, die du extrahieren sollst:
${JSON.stringify(expectedAttributes, null, 2)}

Erwartetes JSON-Format:
{
    "title": "Sauberer Produktname",
    "description": "Hilfreiche Beschreibung (max. 3 Sätze)",
    "supplier": "Name des Lieferanten/Shop",
    "gtin": "7611123456789",
    "price": 12.50,
    "totalPackPrice": null,
    "packQuantity": null,
    "specs": {
        "ID_DES_ATTRIBUTS": "Gefundener Wert"
    },
    "finalImageUrl": "${manualImageUrl || ''}" 
}

URL: ${url}
Zu analysierender Inhalt:
${finalTextToAnalyze}
        `;

        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text();
        
        // --- OPTIMIERUNG 4: Sichereres Stripping ---
        aiResponseText = aiResponseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        
        const extractedData = JSON.parse(aiResponseText);
        
        // Relative URLs sicher auflösen mit Try-Catch
        if (extractedData.finalImageUrl && extractedData.finalImageUrl.startsWith('/')) {
            try {
                const urlObj = new URL(url);
                extractedData.finalImageUrl = `${urlObj.origin}${extractedData.finalImageUrl}`;
            } catch (e) {
                console.warn("Konnte Basis-URL nicht für das Bild parsen:", url);
            }
        }
        
        return json(extractedData);

    } catch (error) {
        console.error("Fehler im Backend bei KI-Extraktion:", error);
        return json({ error: 'Fehler beim Analysieren der Artikeldaten' }, { status: 500 });
    }
}