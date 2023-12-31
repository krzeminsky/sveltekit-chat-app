import { LinkedList } from "$lib/utils/linked-list";
import { MessageGroup } from "./message-group";
import { type ChatData, type Message } from "./types";

export interface ChatView {
    socketUsername: string;
    
    get displayName(): string;

    get id(): number|string;
    get chatCover(): number|null|string;
    get messageGroups(): MessageGroup[];
}

// ? last message is at the bottom of the chat window -> has the highest id

export class ChatTree implements ChatView {
    socketUsername: string;
    data: ChatData;

    hasFullHistory = false;

    messageGroupList = new LinkedList<MessageGroup>();

    constructor(socketUsername: string, data: ChatData) {
        this.socketUsername = socketUsername;
        this.data = data;
    }

    get count() {
        return this.messageGroupList.count;
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
        return this.messageGroupList.toArray();
    }

    get chatPreview() {
        if (this.messageGroupList.last?.value.lastMessage) {
            const message = this.messageGroupList.last.value.lastMessage;

            if (message.is_attachment) return `${message.username} sent an attachment`;
            else return `${message.username? `${message.username}: ` : ''}${message.content}`;
        } else {
            return '';
        }
    }

    // ? message group flow is opposite to message flow
    // ? message group: last group is displayed first
    // ? messages: last message is displayed last in the group
     
    // ? load message, insert at the front of the array
    insertMessage(message: Message) {
        const firstGroup = this.messageGroupList.first?.value;
        
        if (firstGroup && firstGroup.isValidGroupMessage(message)) firstGroup.insertMessage(message);
        else this.messageGroupList.insert(new MessageGroup(message));
    }

    // ? add new message, push to the back of the array
    pushMessage(message: Message) {
        const lastGroup = this.messageGroupList.last?.value;

        if (lastGroup && lastGroup.isValidGroupMessage(message)) lastGroup.pushMessage(message);
        else this.messageGroupList.push(new MessageGroup(message));
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