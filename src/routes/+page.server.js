// src/routes/artikel/+page.server.js
import db from '$lib/server/db.js';

export async function load() {
    const categories = await db.getCategories();
    const articles = await db.getArticles();
    const attributes = await db.getFilterAttributes(); // <-- NEU
    
    return {
        categories,
        articles,
        attributes // <-- NEU
    };
}