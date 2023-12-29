import { withTimeout } from "./utils/with-timeout";

export type Attachment = {
    buffer: Buffer;
    type: string;
}

export type UserAvatarAttachment = {
    buffer: Buffer;
    type: string;
    avatarId: number;
}

const attachments = new Map<number, Blob>();
const cachedUserAvatars = new Map<string, number|null>();

export async function getAttachment(id: number, fallback: () => Promise<Attachment|null>) {
    if (attachments.has(id)) return createUrl(attachments.get(id)!);

    const res = await fallback().catch(null);

    return !res? null : cacheAttachment(id, res);
}

export async function fetchAttachment(id: number) {
    if (attachments.has(id)) return createUrl(attachments.get(id)!);
    
    const res = await withTimeout<Response>(async (resolve) => {
        const response = await fetch('/api/attachments', {
            method: "GET",
            headers: {
                'attachment-id': id.toString()
            }
        });
        
        resolve(response);
    });

    return !res.ok? null : cachceBlob(id, await res.blob());
}

const DEFAULT_USER_AVATAR_URL = 'default-user-avatar.png';

export async function getUserAvatar(username: string, fallback: () => Promise<UserAvatarAttachment|null|undefined>) {
    if (!cachedUserAvatars.has(username)) {
        const res = await fallback().catch(null);
        
        if (typeof res === "undefined") return DEFAULT_USER_AVATAR_URL;
        else if (!res) {
            cachedUserAvatars.set(username, null);
            return DEFAULT_USER_AVATAR_URL;
        } else {
            cachedUserAvatars.set(username, res.avatarId);
            return cacheAttachment(res.avatarId, res);
        }
    } else {
        const id = cachedUserAvatars.get(username);
        if (!id) return DEFAULT_USER_AVATAR_URL;

        return createUrl(attachments.get(id)!); // ? since we already cached the user avatar, it means that the attachment linked to this avatar has also been cached
    }
}

export function cacheAttachment(id: number, attachment: Attachment) {
    return cachceBlob(id, new Blob([attachment.buffer], { type: attachment.type }));
}

export function cachceBlob(id: number, blob: Blob) {
    attachments.set(id, blob);
    return createUrl(blob);
}

function createUrl(blob: Blob) { 
    return window.URL.createObjectURL(blob);
} 