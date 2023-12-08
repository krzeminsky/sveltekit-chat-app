import { auth } from '$lib/server/auth/lucia.js';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => { 
    const session = await auth.handleRequest(event).validate();
    if (!session) throw redirect(302, '/login?returnTo=chat')

    return session;
});