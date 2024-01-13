import { withTimeout } from "./utils/with-timeout";

export type Attachment = {
    buffer: Buffer;
    type: string;
    name: string;
}

export type UserAvatarAttachment = {
    buffer: Buffer;
    type: string;
    name: string;
    avatarId: number;
}

const attachments = new Map<number, { blob: Blob, name: string }>();
const cachedUserAvatars = new Map<string, number|null>();

export async function getAttachment(id: number, fallback: () => Promise<Attachment|null>) {
    if (attachments.has(id)) {
        const attachment = attachments.get(id)!;

        return { url: createUrl(attachment.blob), type: attachment.blob.type, name: attachment.name };
    }

    const res = await fallback().catch(null);
    if (!res) return null;

    const url = cacheAttachment(id, res);
    return { url, type: res.type, name: res.name };
}

export async function fetchAttachment(id: number) {
    if (attachments.has(id)) {
        const attachment = attachments.get(id)!;

        return { url: createUrl(attachment.blob), type: attachment.blob.type, name: attachment.name };
    }
    
    const res = await withTimeout<Response>(async (resolve) => {
        const response = await fetch('/api/attachments', {
            method: "GET",
            headers: {
                'attachment-id': id.toString()
            }
        });
        
        resolve(response);
    });

    if (!res.ok) return null;
    
    const blob = await res.blob();
    const name = res.headers.get('file-name')!;

    return { url: cachceBlob(id, blob, name), type: blob.type, name };
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

        return createUrl(attachments.get(id)!.blob);
    }
}



function cacheAttachment(id: number, attachment: Attachment) {
    return cachceBlob(id, new Blob([attachment.buffer], { type: attachment.type }), attachment.name);
}

function cachceBlob(id: number, blob: Blob, name: string) {
    attachments.set(id, { blob, name });
    return createUrl(blob);
}

function createUrl(blob: Blob) { 
    return window.URL.createObjectURL(blob);
} 