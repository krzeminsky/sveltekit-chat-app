import { auth } from '$lib/server/auth/lucia.js';
import { dbCall } from '$lib/server/db/database.js';
import { fail } from '@sveltejs/kit';

export const load = (async (event) => { 
    const session = await auth.handleRequest(event).validate();
    if (session) return { user: session.user }
});

export const actions = {
    updateAvatar: async (event) => {
        const data = await event.request.formData()
        const attachment = data.get('avatar') as Blob;

        if (!(attachment instanceof Blob)) return fail(400, { error: "Invalid request" });

        const session = await auth.handleRequest(event).validate();
        if (!session) return fail(400, { error: "Invalid request" });

        await dbCall.updateAvatar(session.user.username, attachment);
    }
}