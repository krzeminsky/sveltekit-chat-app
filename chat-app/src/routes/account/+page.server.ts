import { auth } from '$lib/server/auth/lucia.js';

export const load = (async (event) => { 
    const session = await auth.handleRequest(event).validate();
    if (session) return { user: session.user }
});