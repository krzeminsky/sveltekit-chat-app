import type { Chat, ChatMember, Message } from "./types";
import type { IChatTree } from "./ichat-tree";

export class ChatTree implements IChatTree {
    data: Chat;
    members: ChatMember[];

    count: number;

    firstMessage?: MessageNode;
    lastMessage?: MessageNode;

    constructor(data: Chat, members: ChatMember[]) {
        this.data = data;
        this.members = members; 
        
        this.count = 0;
    }

    get firstMessagePreview() {
        if (!this.lastMessage) return 'Chat started';
        else {
            const message = this.lastMessage.message;

            if (message.is_attachment == 1) return `${message.username} sent an attachment`;
            else return `${message.username}: ${message.content}`;
        }
    }

    getName(username: string) {
        if (this.data.private == 1) {
            const other = this.members[0].username == username? this.members[1] : this.members[0];
            return other.nickname??other.username;
        } else {
            return this.data.name??this.members.join(', ');
        }
    }

    getCoverId(username: string) { 
        if (this.data.private == 1) {
            return this.members[0].username == username? this.members[1].avatar_id : this.members[0].avatar_id;
        } else {
            return this.data.cover_id;
        }
    }

    getId() { return this.data.id }

    // ? insert in the front
    insertMessage(message: Message) {
        const temp = this.firstMessage;

        this.firstMessage = new MessageNode(message);

        if (!this.lastMessage) { // ? its the first insert
            this.lastMessage = this.firstMessage;
        } else if (temp) {
            temp.previous = this.firstMessage;
            this.firstMessage.next = temp;
        }

        this.count++;
    }

    // * can be made more efficient, too lazy rn
    insertMessages(messages: Message[]) {
        for (const m of messages) {
            this.insertMessage(m);
        }
    }

    // ? add to the back
    pushMessage(message: Message) {
        const temp = this.lastMessage;

        this.lastMessage = new MessageNode(message);

        if (!this.firstMessage) { // ? its the first insert
            this.firstMessage = this.lastMessage;
        } else if (temp) {
            temp.next = this.lastMessage;
            this.lastMessage.previous = temp;
        }

        this.count++;
    }

    // * can be made more efficient, too lazy rn
    pushMessages(messages: Message[]) {
        for (const m of messages) {
            this.pushMessage(m);
        }
    }

    deleteMessage(messageId: number) {
        let current = this.firstMessage;

        while (current) {
            if (current.message.id == messageId) {
                if (current == this.firstMessage) {
                    if (current.next) {
                        this.firstMessage = current.next;
                        current.next.previous = undefined;
                    } else {
                        this.firstMessage = undefined;
                        this.lastMessage = undefined;
                    }
                }

                if (current == this.lastMessage) {
                    if (current.previous) {
                        this.lastMessage = current.previous;
                        current.previous.next = undefined;
                    } else {
                        this.firstMessage = undefined;
                        this.lastMessage = undefined;
                    }
                }

                if (current.previous) current.previous.next = current.next;
                if (current.next) current.next.previous = current.previous;

                break;
            }

            current = current.next;
        }

        this.count--;
    }

    findMessage(messageId: number) {
        let current = this.firstMessage;
        while (current) {
            if (current.message.id = messageId) return current.message;
        }
    }

    toArray() {
        const res: Message[] = [];

        let current = this.firstMessage;
        while (current) {
            res.push(current.message);
            current = current.next;
        }

        return res;
    }
}

export class MessageNode {
    message: Message;
    next?: MessageNode;
    previous?: MessageNode;

    constructor(message: Message) {
        this.message = message;
    }
}