import { MongoClient, ObjectId } from "mongodb";
import { DB_URI } from "$env/static/private";


const client = new MongoClient(DB_URI);
await client.connect();
const db = client.db("Storify");

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

export default {getmaincategories};