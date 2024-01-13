import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";

export async function getChatCover(coverId: number|null|string, handler: SocketAttachmentHandler) {
    if (typeof coverId === "string") return handler.getUserAvatar(coverId);
    else if (!coverId) return 'default-user-avatar.png';
    else {
        const res = await handler.getAttachment(coverId);
        if (!res) return 'default-user-avatar-png';

        return res.url;
    }
}