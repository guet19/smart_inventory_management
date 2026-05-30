import { json } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
    try {
        const { html, url, expectedAttributes } = await request.json();

        if (!html) return json({ error: 'Kein Text/HTML empfangen.' }, { status: 400 });

        if (!env.GEMINI_API_KEY) {
            console.error("KRITISCHER FEHLER: GEMINI_API_KEY fehlt in den Server-Umgebungsvariablen!");
            return json({ error: 'API-Schlüssel fehlt auf dem Server.' }, { status: 500 });
        }

        let contentToParse = html;

        // Wenn nur eine URL übergeben wird, versuchen wir sie zu laden (Achtung vor Bot-Sperren!)
        if (html.trim().startsWith('http://') || html.trim().startsWith('https://')) {
            try {
                const fetchRes = await fetch(html.trim());
                if (fetchRes.ok) {
                    contentToParse = await fetchRes.text();
                }
            } catch (e) {
                console.error("Fehler beim Herunterladen der URL:", e);
            }
        }

        const $ = cheerio.load(contentToParse);
        
        let manualImageUrl = $('meta[property="og:image"]').attr('content') 
                          || $('meta[name="twitter:image"]').attr('content')
                          || $('img').not('header img, footer img, .icon img').first().attr('src');

        let jsonLdText = "";
        $('script[type="application/ld+json"]').each((_, el) => {
            jsonLdText += $(el).html() + " \n";
        });

        $('script, style, nav, footer, header, noscript, svg, iframe').remove();
        const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000);

        const finalTextToAnalyze = `Versteckte Shop-Daten (JSON-LD):\n${jsonLdText}\n\nSichtbarer Webseiten-Text:\n${cleanText}`;

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `Du bist ein technischer Daten-Extraktor. Extrahiere Produktdaten präzise im JSON-Format.
REGELN:
1. TITEL: Sauberer Artikelname. Keine Shop-Namen oder SEO-Begriffe.
2. BESCHREIBUNG: Schreibe 2-4 informative Sätze basierend auf dem Text. Hebe Besonderheiten (z.B. Omega 3, zuckerfrei) hervor.
3. PREIS & MENGE: Wenn es ein Multipack ist (z.B. '12 x 15g', '48 Stück'), rechne die Gesamtstückzahl aus und trage sie in 'packQuantity' ein. Den Gesamtpreis in 'totalPackPrice'. Bei Einzelartikeln nur 'price'.
4. GTIN/EAN: Suche nach GTIN oder Herstellernummern.
5. ZAHLEN: Bei "ui_type": "number" IMMER nur die nackte Zahl antworten (keine Einheiten!).
6. LIEFERANT: Name des Online-Shops (aus der URL ableiten).
GIB AUSSCHLIESSLICH DAS JSON ZURÜCK! Keine Begrüßung, keine Erklärungen.`,
            generationConfig: { 
                responseMimeType: "application/json", 
                temperature: 0.1 // Wieder etwas strenger, um schnelle, saubere Antworten zu erzwingen
            }
        });

        const prompt = `
Hier sind die erwarteten Attribute, die du extrahieren sollst:
${JSON.stringify(expectedAttributes, null, 2)}

Erwartetes JSON-Format:
{
    "title": "Produktname",
    "description": "Zusammenfassung...",
    "supplier": "Shopname",
    "gtin": "7611123456789",
    "price": 12.50,
    "totalPackPrice": null,
    "packQuantity": null,
    "specs": { "ID": "Wert" },
    "finalImageUrl": "${manualImageUrl || ''}" 
}

URL: ${url}
Inhalt:
${finalTextToAnalyze}
        `;

        const result = await model.generateContent(prompt);
        let aiResponseText = result.response.text();
        
        // DER KUGELSICHERE FIX: Wir filtern alles heraus, was nicht in den geschweiften Klammern steht!
        const match = aiResponseText.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("KI hat kein gültiges JSON-Objekt zurückgegeben.");
        }
        
        const extractedData = JSON.parse(match[0]);
        
        if (extractedData.finalImageUrl && extractedData.finalImageUrl.startsWith('/')) {
            try {
                const urlObj = new URL(url);
                extractedData.finalImageUrl = `${urlObj.origin}${extractedData.finalImageUrl}`;
            } catch (e) {
                console.warn("Konnte Basis-URL nicht parsen:", url);
            }
        }
        
        return json(extractedData);

    } catch (error) {
        console.error("Fehler im Backend bei KI-Extraktion:", error);
        return json({ error: 'Fehler beim Analysieren der Artikeldaten' }, { status: 500 });
    }
}