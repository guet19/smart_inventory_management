// src/routes/logout/+server.js
import { redirect } from '@sveltejs/kit';

export const POST = ({ cookies }) => {
    // Den Session-Cookie löschen
    cookies.delete('session', { path: '/' });
    
    // Zurück zum Login schicken, aber diesmal mit URL-Parameter
    throw redirect(303, '/login?loggedOut=true');
};