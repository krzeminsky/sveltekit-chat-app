import type { Message } from "./types";

export interface IChatTree {
    getName(username: string): string;
    getCoverId(): number|null|undefined;
    toArray(): Message[];
    getId(): number|string;
}