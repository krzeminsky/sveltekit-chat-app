import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";

export async function getChatCover(coverId: number|null|string, handler: SocketAttachmentHandler) {
    if (typeof coverId === "string") return handler.getUserAvatar(coverId);
    else if (!coverId) return 'default-user-avatar.png';
    else return (await handler.getAttachment(coverId))??'default-user-avatar.png';
}