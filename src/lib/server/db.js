import { MongoClient, ObjectId } from "mongodb";
import { DB_URI } from "$env/static/private";

const client = new MongoClient(DB_URI);
await client.connect();
export const db = client.db("Storify");

// --- Funktionen um die Kategorien für die Kategorieeinstellungen zu laden ---
async function getCategories() {
    let categories = [];
    try {
        const collection = db.collection("categories");
        categories = await collection.find({}).toArray();
        
        // MongoDB ObjectIds für Svelte in Strings umwandeln
        categories.forEach(cat => {
            cat._id = cat._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Kategorien:", error);
    }
    return categories;
}

// --- Hauptkategorie erstellen ---
async function createMainCategory(name) {
    try {
        const collection = db.collection("categories");
        const result = await collection.insertOne({
            name: name,
            subcategories: [], // Startet mit einem leeren Array
            createdAt: new Date()
        });
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern der Hauptkategorie:", error);
        throw error;
    }
}

// --- NEU: Unterkategorie hinzufügen ---
async function createSubcategory(mainCategoryId, subName) {
    try {
        const collection = db.collection("categories");
        const subId = "sub_" + Date.now(); // Generiert eine simple, einmalige ID
        
        // Fügt das neue Objekt in das 'subcategories' Array der gewählten Hauptkategorie ein
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId) },
            { $push: { subcategories: { id: subId, name: subName, allowed_attributes: [] } } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern der Unterkategorie:", error);
        throw error;
    }
}
// --- NEU: Hauptkategorie umbenennen ---
async function renameMainCategory(id, newName) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { name: newName } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Umbenennen der Hauptkategorie:", error);
        throw error;
    }
}

// --- NEU: Attribute einer Unterkategorie zuweisen ---
async function updateSubcategoryAttributes(mainCategoryId, subCategoryId, attributeIds) {
    try {
        const collection = db.collection("categories");
        
        // Aktualisiert das 'allowed_attributes' Array der exakt passenden Unterkategorie
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId), "subcategories.id": subCategoryId },
            { $set: { "subcategories.$.allowed_attributes": attributeIds } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Zuweisen der Attribute:", error);
        throw error;
    }
}














//Attributfunktionen für Attributeinstellungen
// --- Filterattribute für die Attributeinstellung zu laden ---
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


// --- Attribut speichern ---
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
// --- Attribut löschen ---
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

// --- Attribut updaten ---
async function updateFilterAttribute(id, attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: attributeData } // Nutzt $set, um nur die angegebenen Felder zu ändern
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Updaten des Attributs:", error);
        throw error;
    }
}

// --- Attribut Hilfsfunktion ---
async function getFilterAttributeByLabel(label) {
    try {
        const collection = db.collection("filter_attributes");
        // Wir suchen mit einem regulären Ausdruck, um Groß-/Kleinschreibung zu ignorieren
        const attribute = await collection.findOne({ 
            label: { $regex: new RegExp(`^${label}$`, 'i') } 
        });
        return attribute;
    } catch (error) {
        console.error("Fehler bei der Label-Prüfung:", error);
        return null;
    }
}

async function addOptionToFilterAttribute(id, newOption) {
    try {
        const collection = db.collection("filter_attributes");
        // $addToSet stellt sicher, dass "M5" nicht doppelt angelegt wird!
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $addToSet: { options: newOption } } 
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Quick-Add:", error);
        throw error;
    }
}

async function removeOptionFromFilterAttribute(id, optionToRemove) {
    try {
        const collection = db.collection("filter_attributes");
        // $pull entfernt genau diesen einen Text-String aus dem Array
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { options: optionToRemove } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Quick-Remove:", error);
        throw error;
    }
}

// --- NEU: Artikel speichern ---
async function createArticle(articleData) {
    try {
        // Wir nutzen eine neue Collection "articles"
        const collection = db.collection("articles");
        const result = await collection.insertOne(articleData);
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern des Artikels:", error);
        throw error;
    }
}

async function getArticles() {
    let articles = [];
    try {
        const collection = db.collection("articles");
        // Sortiert die neuesten Artikel nach oben (-1)
        articles = await collection.find({}).sort({ createdAt: -1 }).toArray();
        
        // ObjectIds für Svelte in Strings umwandeln
        articles.forEach(article => {
            article._id = article._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Artikel:", error);
    }
    return articles;
}
async function getArticleById(id) {
    try {
        const collection = db.collection("articles");
        // Wandelt den String aus der URL in eine echte MongoDB-ID um
        const article = await collection.findOne({ _id: new ObjectId(id) });
        
        if (article) {
            article._id = article._id.toString(); // Für Svelte serialisieren
        }
        return article;
    } catch (error) {
        console.error("Fehler beim Laden des Artikels:", error);
        return null;
    }
}





// Alle Funktionen exportieren
export default { 
    getCategories, 
    getFilterAttributes, 
    createFilterAttribute,
    deleteFilterAttribute,
    updateFilterAttribute,
    getFilterAttributeByLabel,
    createSubcategory,
    createMainCategory,
    updateSubcategoryAttributes,
    addOptionToFilterAttribute,
    removeOptionFromFilterAttribute,
    renameMainCategory,
    createArticle,
    getArticles,
    getArticleById
};