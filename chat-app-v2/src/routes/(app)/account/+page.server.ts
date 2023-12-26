import { auth } from '$lib/server/auth/lucia.js';
import { dbCall } from '$lib/server/db/database.js';
import { usernameRegex } from '$lib/validation/schema.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, parent }) => {
    await parent();
    
    if (!locals.session) throw redirect(302, "/login?returnTo=account");
}

export const actions = {
    uploadAvatar: async (event) => {
        const data = await event.request.formData();

        const attachment = data.get('avatar') as Blob;
        if (!(attachment instanceof Blob)) return fail(400);

        const session = await auth.handleRequest(event).validate();
        if (!session) return fail(400);

        await dbCall.setUserAvatar(session.user.username, attachment);
    },

    deleteAvatar: async (event) => {
        const session = await auth.handleRequest(event).validate();
        if (!session) return fail(400);

        await dbCall.setUserAvatar(session.user.username, null);
    },

    /* database was not designed with changing usernames in mind, too bad!
    changeUsername: async (event) => {
        const data = await event.request.formData();
        
        const newUsername = data.get('newUsername') as string;
        if (!newUsername || newUsername.length > 16 || !usernameRegex.test(newUsername)) return fail(400);

        const session = await auth.handleRequest(event).validate();
        if (!session) return fail(400);

        dbCall.changeUsername(session.user.username, newUsername);
    }
    */
}