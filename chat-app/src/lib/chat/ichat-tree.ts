import type { Message } from "./types";

export interface IChatTree {
    getName(username: string): string;
    getCoverId(username: string): number|null|undefined;
    toArray(): Message[];
    getId(): number|string;
}

export function isChatTree(obj: any): obj is IChatTree {
    return 'getCoverId' in obj;
}