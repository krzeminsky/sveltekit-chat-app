import { auth } from '$lib/server/auth/lucia.js';
import { dbCall } from '$lib/server/db/database.js';
import { error } from '@sveltejs/kit';

export const GET = async (event) => {  
    const attachmentId = Number(event.request.headers.get('attachment-id'));
    if (isNaN(attachmentId)) throw error(400);

    const data = dbCall.getAttachmentData(attachmentId);
    if (!data) throw error(400);

    if (data.chat_id) {
        const session = await auth.handleRequest(event).validate();

        if (session && dbCall.isChatMember(session.user.username, data.chat_id)) return createResponse(attachmentId, data.type);
        else throw error(400);
    } else return createResponse(attachmentId, data.type);
}

function createResponse(attachmentId: number, type: string) {
    return new Response(dbCall.getAttachment(attachmentId), { headers: { 'Content-Type': type } })
}