import type { ChatTree } from "./chat-view";

export class ChatListWrapper {
    array: ChatTree[] = [];

    get empty() { return this.array.length == 0 }

    insertOrPushToFront(item: ChatTree) {
        const index = this.array.indexOf(item);
        
        if (index == -1) this.array.unshift(item);
        else this.array = [item, ...this.array.slice(0, index), ...this.array.slice(index + 1)]; 
    }

    push(...items: ChatTree[]) {
        this.array.push(...items);
    }

    delete(chatId: number) {
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i].id == chatId) {
                this.array.splice(i, 1);
                return;
            }
        }
    }
}