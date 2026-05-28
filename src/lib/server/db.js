import { MongoClient, ObjectId } from "mongodb";
import { DB_URI } from "$env/static/private";

const client = new MongoClient(DB_URI);
await client.connect();
export const db = client.db("Storify");

// ==========================================
// 1. KATEGORIEN VERWALTUNG
// ==========================================

async function getCategories() {
    let categories = [];
    try {
        const collection = db.collection("categories");
        categories = await collection.find({}).toArray();
        categories.forEach(cat => {
            cat._id = cat._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Kategorien:", error);
    }
    return categories;
}

async function createMainCategory(name) {
    try {
        const collection = db.collection("categories");
        const result = await collection.insertOne({
            name: name,
            subcategories: [], 
            createdAt: new Date()
        });
        return result.insertedId; 
    } catch (error) {
        console.error("Fehler beim Speichern der Hauptkategorie:", error);
        throw error;
    }
}

async function createSubcategory(mainCategoryId, subName) {
    try {
        const collection = db.collection("categories");
        const subId = "sub_" + Date.now(); 
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

async function deleteSubcategory(mainCategoryId, subCategoryId) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId) },
            { $pull: { subcategories: { id: subCategoryId } } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen der Unterkategorie:", error);
        throw error;
    }
}

async function deleteMainCategory(id) {
    try {
        const collection = db.collection("categories");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen der Hauptkategorie:", error);
        throw error;
    }
}

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

// NEU: Funktion zum Umbenennen der Unterkategorie
async function renameSubcategory(mainCategoryId, subCategoryId, newName) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId), "subcategories.id": subCategoryId },
            { $set: { "subcategories.$.name": newName } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Umbenennen der Unterkategorie:", error);
        throw error;
    }
}

async function updateSubcategoryAttributes(mainCategoryId, subCategoryId, attributeIds) {
    try {
        const collection = db.collection("categories");
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

// ==========================================
// 2. FILTER-ATTRIBUTE VERWALTUNG
// ==========================================

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

async function createFilterAttribute(attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.insertOne(attributeData);
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern des Attributs:", error);
        throw error; 
    }
}

async function deleteFilterAttribute(id) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen des Attributs:", error);
        throw error;
    }
}

async function updateFilterAttribute(id, attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: attributeData } 
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Updaten des Attributs:", error);
        throw error;
    }
}

async function getFilterAttributeByLabel(label) {
    try {
        const collection = db.collection("filter_attributes");
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

// ==========================================
// 3. ARTIKEL VERWALTUNG
// ==========================================

async function createArticle(articleData) {
    try {
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
        articles = await collection.find({}).sort({ createdAt: -1 }).toArray();
        
        articles.forEach(article => {
            if (article._id) article._id = article._id.toString();
            if (article.mainCategoryId) article.mainCategoryId = article.mainCategoryId.toString();
            if (article.createdAt) article.createdAt = article.createdAt.toISOString();
            if (article.updatedAt) article.updatedAt = article.updatedAt.toISOString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Artikel:", error);
    }
    return articles;
}

async function getArticleById(id) {
    try {
        const collection = db.collection("articles");
        const article = await collection.findOne({ _id: new ObjectId(id) });
        
        if (article) {
            article._id = article._id.toString(); 
        }
        return article;
    } catch (error) {
        console.error("Fehler beim Laden des Artikels:", error);
        return null;
    }
}

// NEU: Funktion zum Aktualisieren eines Artikels (z.B. Bestand)
async function updateArticle(id, updateData) {
    try {
        const collection = db.collection("articles");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Artikels:", error);
        throw error;
    }
}

export default { 
    getCategories, 
    createMainCategory,
    createSubcategory,
    deleteSubcategory,
    deleteMainCategory, 
    renameMainCategory,
    renameSubcategory,
    updateSubcategoryAttributes,
    getFilterAttributes, 
    createFilterAttribute,
    deleteFilterAttribute,
    updateFilterAttribute,
    getFilterAttributeByLabel,
    addOptionToFilterAttribute,
    removeOptionFromFilterAttribute,
    createArticle,
    getArticles,
    getArticleById,
    updateArticle // <--- NEU
};