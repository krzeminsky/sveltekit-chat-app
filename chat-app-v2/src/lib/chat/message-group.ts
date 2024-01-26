import type { ChatTree } from "./chat-view";
import type { Message } from "./types";

const NEW_GROUP_TIME_DIFFERENCE_THRESHOLD = 1000 * 60 * 2; // ? 2 minutes

let messageGroupCount = 0;

export class MessageGroup {
    messages: Message[]; // ? this array most of the time won't be big enough to make it a linked list
    tree: ChatTree;
    username: string;
    id: number;

    get lastMessage() { return this.messages[this.messages.length - 1] }
    get firstMessage() { return this.messages[0] }
    get firstTimestamp() { return this.firstMessage.timestamp; }

    constructor(tree: ChatTree, message: Message) {
        this.tree = tree;
        this.username = message.username;
        this.messages = [message];

        this.id = messageGroupCount;
        messageGroupCount++;
    }

    insertMessage(message: Message) {
        this.messages.unshift(message);
    }

    pushMessage(message: Message) {
        this.messages.push(message);
    }

    /**
     * 
     * @returns A boolean indicating if the group is empty after the deletion
     */
    delete(messageId: number) {
        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].id == messageId) {
                this.messages.splice(i, 1);
                return this.messages.length == 0;
            }
        }

        return false;
    }

    // ? if the message's username does not match the group's username or if the message was sent too long after the last message in this group, this message does not belong to this group
    isValidGroupMessage(message: Message) {        
        return this.username == message.username 
            && message.timestamp > this.firstMessage.timestamp - NEW_GROUP_TIME_DIFFERENCE_THRESHOLD 
            && message.timestamp < this.lastMessage.timestamp + NEW_GROUP_TIME_DIFFERENCE_THRESHOLD;
    }
}