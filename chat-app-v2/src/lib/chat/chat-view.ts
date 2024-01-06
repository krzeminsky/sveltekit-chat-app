import { LinkedList } from "$lib/utils/linked-list";
import { MessageGroup } from "./message-group";
import { type ChatData, type Message } from "./types";

export interface ChatView {
    get displayName(): string;

    get id(): number|string;
    get chatCover(): number|null|string;
    get messageGroups(): MessageGroup[];
}

export class TempChat implements ChatView {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    get displayName() { return this.name }
    get id() { return this.name }
    get chatCover() { return this.name }
    get messageGroups() { return [] }
}

// ? last message is at the bottom of the chat window -> has the highest id

export class ChatTree implements ChatView {
    socketUsername: string;
    data: ChatData;

    hasFullHistory = false;
    count = 0;

    messageGroupList = new LinkedList<MessageGroup>();

    constructor(socketUsername: string, data: ChatData) {
        this.socketUsername = socketUsername;
        this.data = data;
    }

    get members() { 
        return this.data.members;
    }

    get otherMember() {
        return this.members[0].username == this.socketUsername? this.members[1] : this.members[0];
    }

    get chatInfo() { 
        return this.data.chat;
    }

    get displayName() {
        if (this.chatInfo.private == 1) {
            const other = this.otherMember;
            return other.nickname??other.username;
        } else {
            return this.chatInfo.name??this.members.map(m => m.username).join(', ');
        }
    }

    get chatCover() {
        if (this.chatInfo.private == 1) return this.otherMember.username;
        else return this.chatInfo.cover_id;
    }

    get id() {
        return this.chatInfo.id;
    }

    get messageGroups() {
        return this.messageGroupList.toReversedArray();
    }

    get lastMessagePreview() {
        const message = this.messageGroupList.last?.value.lastMessage;

        if (!message) return '';

        if (message.is_attachment) return `${message.username} sent an attachment`;
        else return `${message.username? `${message.username}: ` : ''}${message.content}`;
    }

    get lastMessageTime() {
        const message = this.messageGroupList.last?.value.lastMessage;

        if (!message) return '';

        return new Date(message.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    // ? load message, insert at the front of the array
    insertMessage(message: Message) {
        const firstGroup = this.messageGroupList.first?.value;
        
        if (firstGroup && firstGroup.isValidGroupMessage(message)) firstGroup.insertMessage(message);
        else this.messageGroupList.insert(new MessageGroup(message));

        this.count++;
    }

    // ? add new message, push to the back of the array
    pushMessage(message: Message) {
        const lastGroup = this.messageGroupList.last?.value;

        if (lastGroup && lastGroup.isValidGroupMessage(message)) {
            lastGroup.pushMessage(message);
        } else {
            this.messageGroupList.push(new MessageGroup(message));
        }

        this.count++;
    }

    insertMultiple(messages: Message[]) {
        for (const m of messages) this.insertMessage(m);
    }
    
    pushMultiple(messages: Message[]) {
        for (const m of messages) this.pushMessage(m);
    }

    findGroupWithMessage(messageId: number) {
        return this.messageGroupList.firstMatch(g => g.firstMessage.id <= messageId && g.lastMessage.id <= messageId);
    }

    findMessage(messageId: number) {
        const group = this.findGroupWithMessage(messageId);
        if (!group) return undefined;

        return group.messages.find(m => m.id = messageId);
    }

    deleteMessage(messageId: number) {
        // ? narrowing down the search list by filtering out groups that can't contain the message id
        const group = this.findGroupWithMessage(messageId);

        // ? if group was found and after the deletion the group is empty
        if (group && group.delete(messageId)) this.messageGroupList.delete(group);
    }

    deleteMember(username: string) {
        const members = this.members;
        for (let i = 0; i < members.length; i++) {
            if (members[i].username == username) {
                members.splice(i, 1);
                return;
            }
        }
    }
}