import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, parent }) => {
    await parent();

    if (!locals.session) throw redirect(302, "/login?returnTo=chat");
}