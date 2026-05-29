import { MongoClient, ObjectId } from "mongodb";
import { DB_URI } from "$env/static/private";
import bcrypt from "bcryptjs"; 

const client = new MongoClient(DB_URI);
await client.connect();
export const db = client.db("Storify");

// ==========================================
// 1. KATEGORIEN VERWALTUNG
// ==========================================

async function getCategories(userId) {
    let categories = [];
    try {
        const collection = db.collection("categories");
        // NEU: Nur Kategorien dieses Users laden
        categories = await collection.find({ userId: userId }).toArray();
        categories.forEach(cat => {
            cat._id = cat._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Kategorien:", error);
    }
    return categories;
}

async function createMainCategory(userId, name) {
    try {
        const collection = db.collection("categories");
        const result = await collection.insertOne({
            userId: userId, // NEU: Verknüpfung zum Nutzer
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

async function createSubcategory(userId, mainCategoryId, subName) {
    try {
        const collection = db.collection("categories");
        const subId = "sub_" + Date.now(); 
        const result = await collection.updateOne(
            // NEU: userId in der Abfrage als Sicherheitscheck
            { _id: new ObjectId(mainCategoryId), userId: userId },
            { $push: { subcategories: { id: subId, name: subName, allowed_attributes: [] } } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern der Unterkategorie:", error);
        throw error;
    }
}

async function deleteSubcategory(userId, mainCategoryId, subCategoryId) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId), userId: userId },
            { $pull: { subcategories: { id: subCategoryId } } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen der Unterkategorie:", error);
        throw error;
    }
}

async function deleteMainCategory(userId, id) {
    try {
        const collection = db.collection("categories");
        const result = await collection.deleteOne({ _id: new ObjectId(id), userId: userId });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen der Hauptkategorie:", error);
        throw error;
    }
}

async function renameMainCategory(userId, id, newName) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: userId },
            { $set: { name: newName } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Umbenennen der Hauptkategorie:", error);
        throw error;
    }
}

async function renameSubcategory(userId, mainCategoryId, subCategoryId, newName) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId), userId: userId, "subcategories.id": subCategoryId },
            { $set: { "subcategories.$.name": newName } }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Umbenennen der Unterkategorie:", error);
        throw error;
    }
}

async function updateSubcategoryAttributes(userId, mainCategoryId, subCategoryId, attributeIds) {
    try {
        const collection = db.collection("categories");
        const result = await collection.updateOne(
            { _id: new ObjectId(mainCategoryId), userId: userId, "subcategories.id": subCategoryId },
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

async function getFilterAttributes(userId) {
    let attributes = [];
    try {
        const collection = db.collection("filter_attributes");
        attributes = await collection.find({ userId: userId }).toArray();
        attributes.forEach(attr => {
            attr._id = attr._id.toString();
        });
    } catch (error) {
        console.error("Fehler beim Laden der Attribute:", error);
    }
    return attributes;
}

async function createFilterAttribute(userId, attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        // Sicherstellen, dass die userId ins Dokument geschrieben wird
        const dataToInsert = { ...attributeData, userId: userId };
        const result = await collection.insertOne(dataToInsert);
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern des Attributs:", error);
        throw error; 
    }
}

async function deleteFilterAttribute(userId, id) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.deleteOne({ _id: new ObjectId(id), userId: userId });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen des Attributs:", error);
        throw error;
    }
}

async function updateFilterAttribute(userId, id, attributeData) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: userId },
            { $set: attributeData } 
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Updaten des Attributs:", error);
        throw error;
    }
}

async function getFilterAttributeByLabel(userId, label) {
    try {
        const collection = db.collection("filter_attributes");
        const attribute = await collection.findOne({ 
            userId: userId,
            label: { $regex: new RegExp(`^${label}$`, 'i') } 
        });
        return attribute;
    } catch (error) {
        console.error("Fehler bei der Label-Prüfung:", error);
        return null;
    }
}

async function addOptionToFilterAttribute(userId, id, newOption) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: userId },
            { $addToSet: { options: newOption } } 
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Quick-Add:", error);
        throw error;
    }
}

async function removeOptionFromFilterAttribute(userId, id, optionToRemove) {
    try {
        const collection = db.collection("filter_attributes");
        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: userId },
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

async function createArticle(userId, articleData) {
    try {
        const collection = db.collection("articles");
        const dataToInsert = { ...articleData, userId: userId };
        const result = await collection.insertOne(dataToInsert);
        return result;
    } catch (error) {
        console.error("Fehler beim Speichern des Artikels:", error);
        throw error;
    }
}

async function getArticles(userId) {
    let articles = [];
    try {
        const collection = db.collection("articles");
        articles = await collection.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
        
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

async function getArticleById(userId, id) {
    try {
        const collection = db.collection("articles");
        const article = await collection.findOne({ _id: new ObjectId(id), userId: userId });
        
        if (article) {
            article._id = article._id.toString(); 
        }
        return article;
    } catch (error) {
        console.error("Fehler beim Laden des Artikels:", error);
        return null;
    }
}

async function updateArticle(userId, id, updateData) {
    try {
        const collection = db.collection("articles");
        const result = await collection.updateOne(
            { _id: new ObjectId(id), userId: userId },
            { $set: updateData }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Artikels:", error);
        throw error;
    }
}

async function deleteArticle(userId, id) {
    try {
        const collection = db.collection("articles");
        // Der Sicherheitscheck: Lösche nur, wenn die ID UND die userId übereinstimmen!
        const result = await collection.deleteOne({ 
            _id: new ObjectId(id), 
            userId: userId 
        });
        return result;
    } catch (error) {
        console.error("Fehler beim Löschen des Artikels:", error);
        throw error;
    }
}

// ==========================================
// 4. BENUTZER VERWALTUNG (BCRYPT)
// ==========================================

async function getUserByEmail(email) {
    try {
        const collection = db.collection("users");
        return await collection.findOne({ email: email });
    } catch (error) {
        console.error("Fehler beim Suchen des Benutzers:", error);
        return null;
    }
}

async function createInitialUser(email, plainTextPassword, userData = {}, verificationData = {}) {
    try {
        const collection = db.collection("users");
        const existingUser = await collection.findOne({ email: email });
        if (existingUser) return { success: false, message: "Benutzer existiert bereits" };

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

        const result = await collection.insertOne({
            email: email,
            password: hashedPassword,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            country: userData.country || "",
            birthDate: userData.birthDate ? new Date(userData.birthDate) : null,
            createdAt: new Date(),
            
            // NEU: Verifizierungs-Daten
            isVerified: false,
            verificationCode: verificationData.code,
            verificationToken: verificationData.token,
            verificationExpires: verificationData.expires
        });

        return { success: true, userId: result.insertedId.toString() };
    } catch (error) {
        throw error;
    }
}

// NEUE Funktion: Nutzer verifizieren (überprüft Code ODER Token)
async function verifyUser(emailOrToken, isToken = false) {
    try {
        const collection = db.collection("users");
        const query = isToken ? { verificationToken: emailOrToken } : { email: emailOrToken };
        
        const user = await collection.findOne(query);
        
        if (!user) return { success: false, message: "Nutzer nicht gefunden." };
        if (user.isVerified) return { success: false, message: "Account ist bereits verifiziert." };
        if (user.verificationExpires < new Date()) return { success: false, message: "Der Code ist abgelaufen. Bitte registriere dich neu." };

        // Bei Erfolg: isVerified auf true setzen und Codes aus Sicherheitsgründen löschen
        await collection.updateOne(
            { _id: user._id },
            { 
                $set: { isVerified: true },
                $unset: { verificationCode: "", verificationToken: "", verificationExpires: "" }
            }
        );

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Datenbankfehler bei der Verifizierung." };
    }
}

async function getUserById(id) {
    try {
        // NEU: Prüfen, ob die ID überhaupt das richtige MongoDB-Format hat
        if (!ObjectId.isValid(id)) {
            return null; // Wenn nicht (z.B. die alte UUID), direkt abbrechen
        }
        
        const collection = db.collection("users");
        return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
        console.error("Fehler beim Suchen des Benutzers nach ID:", error);
        return null;
    }
}

async function updateUser(id, updateData) {
    try {
        const collection = db.collection("users");
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        return result;
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Benutzers:", error);
        throw error;
    }
}
// ==========================================
// 5. SECURITY & LOGGING (Neu)
// ==========================================

async function getLoginAttempt(ip) {
    try {
        const collection = db.collection("loginAttempts");
        return await collection.findOne({ ip: ip });
    } catch (error) {
        console.error("Fehler beim Laden der Login-Versuche:", error);
        return null;
    }
}

async function upsertLoginAttempt(ip, count, lockUntil) {
    try {
        const collection = db.collection("loginAttempts");
        return await collection.updateOne(
            { ip: ip },
            { 
                $set: { 
                    count: count, 
                    lockUntil: lockUntil,
                    createdAt: new Date() // Trigger für den Compass TTL-Index!
                } 
            },
            { upsert: true }
        );
    } catch (error) {
        console.error("Fehler beim Speichern des Login-Versuchs:", error);
    }
}

async function deleteLoginAttempt(ip) {
    try {
        const collection = db.collection("loginAttempts");
        return await collection.deleteOne({ ip: ip });
    } catch (error) {
        console.error("Fehler beim Löschen des Login-Versuchs:", error);
    }
}

async function createSessionLog(sessionId, userId, email) {
    try {
        const collection = db.collection("sessionLogs");
        return await collection.insertOne({
            sessionId: sessionId,
            userId: new ObjectId(userId),
            email: email,
            loginTime: new Date(),
            logoutTime: null, 
            lastActive: new Date(),
            createdAt: new Date() // Trigger für den Compass TTL-Index!
        });
    } catch (error) {
        console.error("Fehler beim Erstellen des Session-Logs:", error);
    }
}

async function endSessionLog(sessionId) {
    try {
        const collection = db.collection("sessionLogs");
        return await collection.updateOne(
            { sessionId: sessionId },
            { $set: { logoutTime: new Date(), lastActive: new Date() } }
        );
    } catch (error) {
        console.error("Fehler beim Beenden des Session-Logs:", error);
    }
}

async function savePasswordResetToken(email) {
    try {
        const collection = db.collection("users");
        // Wir erzeugen einen sicheren, zufälligen Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // Token ist exakt 1 Stunde gültig

        const result = await collection.updateOne(
            { email: email },
            { $set: { resetToken: token, resetExpires: expires } }
        );

        // Wenn der Nutzer existierte, geben wir den Token zurück (für die E-Mail)
        if (result.modifiedCount > 0) return token;
        return null;
    } catch (error) {
        console.error("Fehler beim Speichern des Reset-Tokens:", error);
        return null;
    }
}

async function getUserByResetToken(token) {
    try {
        const collection = db.collection("users");
        const user = await collection.findOne({ resetToken: token });
        
        // Prüfen ob Token existiert und noch nicht abgelaufen ist
        if (!user || user.resetExpires < new Date()) return null;
        return user;
    } catch (error) {
        console.error("Fehler beim Suchen des Tokens:", error);
        return null;
    }
}

async function resetUserPassword(userId, plainTextPassword) {
    try {
        const collection = db.collection("users");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

        await collection.updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { password: hashedPassword },
                // Token und Ablaufdatum nach Erfolg komplett aus DB löschen
                $unset: { resetToken: "", resetExpires: "" } 
            }
        );
        return true;
    } catch (error) {
        console.error("Fehler beim Zurücksetzen des Passworts:", error);
        return false;
    }
} // <--- DIESE KLAMMER HAT GEFEHLT!

// Hier folgt jetzt ein sauberer Export-Block:
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
    updateArticle,
    deleteArticle,
    getUserByEmail,
    createInitialUser,
    getUserById,
    updateUser,
    verifyUser,
    getLoginAttempt,
    upsertLoginAttempt,
    deleteLoginAttempt,
    createSessionLog,
    endSessionLog,
    savePasswordResetToken,
    getUserByResetToken,
    resetUserPassword
};