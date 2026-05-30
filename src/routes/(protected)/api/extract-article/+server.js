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
        
        // --- HIER WURDEN DIE REGELN FÜR DIE KI OPTIMIERT ---
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `Du bist ein technischer Daten-Extraktor für das lokale Lagermanagement-System "Sortify". 
Deine primäre Aufgabe ist es, Produktdaten präzise im JSON-Format zu extrahieren.

WICHTIGE REGELN:
1. TITEL: Generiere einen sauberen, professionellen Artikelnamen. Entferne zwingend alle Shop-Namen und SEO-Begriffe.
2. BESCHREIBUNG: Schreibe eine informative, ausführliche und ansprechende Zusammenfassung (ca. 3-5 Sätze). Nutze die gelieferten Shop-Texte, um die wichtigsten Eigenschaften (z.B. Inhaltsstoffe, Besonderheiten, Funktionen) hervorzuheben. Zu kurze Einzeiler sind verboten!
3. PREIS & MENGE (SEHR WICHTIG): Suche extrem genau nach dem Preis (z.B. CHF, Fr., EUR). Wenn es ein Multipack, Mix oder Sparpaket ist (z.B. '12 x 15g' oder 'Mix 1: 48 Stück'), rechne die absolute Gesamtstückzahl aus und trage sie in 'packQuantity' ein. Den gefundenen Gesamtpreis trägst du in 'totalPackPrice' ein. Bei reinen Einzelartikeln fülle nur 'price' aus.
4. GTIN/EAN: Suche nach GTIN, EAN oder eindeutigen Herstellernummern.
5. ZAHLEN & EINHEITEN: Wenn ein Attribut den "ui_type": "number" hat, antworte AUSSCHLIESSLICH mit der nackten Zahl (Punkt als Komma).
6. LIEFERANT / SHOP: Mit "supplier" ist zwingend der Name des Online-Shops gemeint (z.B. "zooplus", "Galaxus"). Leite diesen aus der URL ab.`,
            generationConfig: { 
                responseMimeType: "application/json", 
                // Temperature minimal erhöht, damit die KI bessere, flüssigere Texte schreibt
                temperature: 0.2 
            }
        });

        const prompt = `
Hier sind die erwarteten Attribute, die du extrahieren sollst:
${JSON.stringify(expectedAttributes, null, 2)}

Erwartetes JSON-Format:
{
    "title": "Sauberer Produktname",
    "description": "Ausführliche und hilfreiche Beschreibung...",
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
        
        aiResponseText = aiResponseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const extractedData = JSON.parse(aiResponseText);
        
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