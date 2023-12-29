import { getAttachment, getUserAvatar, type Attachment, type UserAvatarAttachment } from "$lib/attachment-cache";
import { withTimeout } from "$lib/utils/with-timeout";
import { Socket } from "socket.io-client";

// ? this is required to allow other classes to use this socket as it's attachment handler, but at the same time to not give them control over the socket

function getUserAvatarOverWs(username: string, socket: Socket) {
    return getUserAvatar(username, () => withTimeout(resolve => socket.emit("getUserAvatar", username, (res: UserAvatarAttachment) => resolve(res))));
}

function getAttachmentOverWs(id: number, socket: Socket) {
    return getAttachment(id, () => withTimeout<Attachment>(resolve => {
        socket.emit("getAttachment", id, (attachment: Attachment) => resolve(attachment));
    }));
}

export class SocketAttachmentHandler {
    getUserAvatar: (username: string) => Promise<string>;
    getAttachment: (id: number) => Promise<string|null>;

    constructor(socket: Socket) {
        this.getUserAvatar = (username: string) => getUserAvatarOverWs(username, socket);
        this.getAttachment = (id: number) => getAttachmentOverWs(id, socket);
    }
}