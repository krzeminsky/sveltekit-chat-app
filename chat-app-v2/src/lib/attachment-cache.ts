import { withTimeout } from "./utils/with-timeout";

export type Attachment = {
    buffer: Buffer;
    type: string;
}

const attachments = new Map<number, Blob>();

export async function getAttachment(id: number, fallback: () => Promise<Attachment|Blob>) {
    if (attachments.has(id)) return createUrl(attachments.get(id)!);

    const res = await fallback();
    if (!res) return null;

    if (res instanceof Blob) return cachceBlob(id, res);
    else return cacheAttachment(id, res);
}

export async function fetchAttachment(id: number) {
    const res = await withTimeout<Response>(async (resolve) => {
        const response = await fetch('/api/attachments', {
            method: "GET",
            headers: {
                'attachment-id': id.toString()
            }
        });
        
        resolve(response);
    });

    return await res.blob();
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