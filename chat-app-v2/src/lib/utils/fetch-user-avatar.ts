import { getAttachment, fetchAttachment } from "$lib/attachment-cache";

export async function fetchUserAvatar(avatarId: number|null) {
    return !avatarId? null : fetchAttachment(avatarId);
}