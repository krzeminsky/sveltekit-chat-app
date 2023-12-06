import { auth } from '$lib/server/auth/lucia.js';
import { AuthError } from '$lib/validation/auth-error.js'
import { formSchema } from '$lib/validation/schema.js';
import { fail, redirect } from '@sveltejs/kit'

export const actions = {
    default: async (event) => {
        const parsedData = formSchema.safeParse(Object.fromEntries(await event.request.formData()));

        // ? since we already do client side validation, this error will be returned only when user uses a script and purposely sends invalid data
        if (!parsedData.success) return fail(400, { error: AuthError.Unknown });
    
        try {
            await auth.createUser({
                key: {
                    providerId: "username",
                    providerUserId: parsedData.data.username,
                    password: parsedData.data.password
                },

                attributes: { 
                    username: parsedData.data.username,
                    block_list: "",
                    avatar_id: null
                }
            });

            const key = await auth.useKey("username", parsedData.data.username, parsedData.data.password);
            const session = await auth.createSession({ userId: key.userId, attributes: { } });

            auth.handleRequest(event).setSession(session);
        } catch (error) {
            console.log(error);
            return fail(400, { error: AuthError.UsernameInUse });
        }

        throw redirect(302, `/${event.url.searchParams.get('returnTo')??'account'}`);
    }
}