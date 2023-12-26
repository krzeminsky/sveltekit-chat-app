import { auth } from '$lib/server/auth/lucia.js'
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
    const session = await auth.handleRequest(event).validate();
    event.locals.session = session;

    if (session) {
        return { session, avatar: session.user.avatarId }
    }

    return { session, avatar: null }
}