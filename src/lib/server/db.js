import { MongoClient, ObjectId } from "mongodb";
import { DB_URI } from "$env/static/private";

const client = new MongoClient(DB_URI);
await client.connect();
const db = client.db("Storify");

// --- Deine bestehende Funktion ---
async function getmaincategories() {
    let maincategories = [];
    try {
        const collection = db.collection("category");
        const query = {};
        const projection = {name: 1};
        maincategories = await collection.find(query).project(projection).toArray();
        maincategories.forEach(category => {
            category._id = category._id.toString();
        });
    } catch (error) { 
        console.error("Fehler beim Laden der Kategorien:", error);
    }
    return maincategories;
} 

// --- NEU: Attribute laden ---
async function getFilterAttributes() {
    let attributes = [];
    try {
        const collection = db.collection("filter_attributes");
        attributes = await collection.find({}).toArray();
        
        attributes.forEach(attr => {
            attr._id = attr._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Attribute:", error);
    }
    return attributes;
}

// --- NEU: Attribut speichern ---
async function createFilterAttribute(attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.insertOne(attributeData);
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern des Attributs:", error);
        throw error; // Wir werfen den Fehler weiter, damit die Seite weiss, dass etwas schiefgelaufen ist
    }
}

async function deleteFilterAttribute(id) {
    try {
        const collection = db.collection("filter_attributes");
        // MongoDB erwartet ein ObjectId für die Suche nach der _id
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen des Attributs:", error);
        throw error;
    }
}

// Alle Funktionen exportieren
export default { 
    getmaincategories, 
    getFilterAttributes, 
    createFilterAttribute,
    deleteFilterAttribute
};