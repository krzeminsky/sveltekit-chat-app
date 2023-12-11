import type { IChatTree } from "./ichat-tree";
import type { Message } from "./types";

export class TempChatTree implements IChatTree {
    name: string;
    coverId: number|null;

    constructor(name: string, coverId: number|null) {
        this.name = name;
        this.coverId = coverId;
    }

    getName(username: string) { return this.name }
    getCoverId() { return this.coverId }

    toArray() { return [] }

    getId() { return this.name }
}