import db from "$lib/server/db.js";

export async function load() {
    return {
        categories: await db.getmaincategories()
    }
}