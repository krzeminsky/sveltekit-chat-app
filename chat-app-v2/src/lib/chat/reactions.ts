export const reactionMap = ['❤️', '😂', '😥', '😠', '👍', '👎'];

export function decodeReactions(reactions: string) {
    const output = new Map<string, number>();
    const pairs = reactions.split(',');

    pairs.map(p => {
        const [username, reactionId] = p.split(':');

        output.set(username, Number(reactionId));
    });

    return output;
}

export function getUsersReaction(username: string, reactions: string) {
    const pairs = reactions.split(',');

    for (const p of pairs) {
        const [pairUsername, reactionId] = p.split(':');

        if (pairUsername == username) return Number(reactionId);
    }

    return null;
}

export function getReactionCount(reactions: string) {
    return reactions.split(',').length;
}