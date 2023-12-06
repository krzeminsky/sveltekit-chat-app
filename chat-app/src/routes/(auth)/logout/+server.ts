import { auth } from '$lib/server/auth/lucia.js'
import { redirect } from '@sveltejs/kit';

export const POST = async (event) => {
    const authRequest = auth.handleRequest(event)
    const session = await authRequest.validate();
    
    if (!session) throw redirect(302, "/");

    await auth.invalidateSession(session.sessionId);
    authRequest.setSession(null);

    throw redirect(302, "/");
}