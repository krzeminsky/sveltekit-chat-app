import type { Chat, ChatMember, Message } from "./types";

export class ChatTree {
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
            res.push(current .message);
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