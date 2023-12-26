import type { Socket } from "socket.io-client";
import type { Chat, ChatData, ChatMember, Message, SearchResult } from "./types";
import { getAttachment as getCachedAttachment, type Attachment, cacheAttachment } from "../attachment-cache";
import { withTimeout } from "$lib/utils/with-timeout";

type SocketEvents = {
    connected: (data: { chat: Chat, members: ChatMember[], messages: Message[] }[]) => void;
    messageReceived: (message: Message) => void;
    messageDeleted: (messageId: number, chatId: number) => void;
    groupChatCreated: (data: ChatData, systemMessage: string) => void;
    groupChatDeleted: (chatId: number) => void;
    chatMemberLeft: (chatId: number, member: string, newOwner: string|undefined, systemMessage: string) => void;
    chatMemberAdded: (chatId: number, member: string, systemMessage: string) => void;
    chatMemberRemoved: (chatId: number, member: string, systemMessage: string) => void;
    chatNameSet: (chatId: number, chatName: string|null, systemMessage: string) => void;
    chatCoverSet: (chatId: number, coverId: number|null, systemMessage: string) => void;
    chatNicknameSet: (chatId: number, member: string, nickname: string|null, systemMessage: string) => void;
    chatMemberRankChanged: (chatId: number, member: string, rank: number, systemMessage: string) => void;
    messageReactionsSet: (chatId: number, messageId: number, reactions: string) => void;
    userBlockStateChanged: (user: string, state: boolean) => void;
}

function registerSocketEvents(socket: Socket, events: SocketEvents) {
    socket.on('connected', events.connected);
    socket.on('messageReceived', events.messageReceived);
    socket.on('messageDeleted', events.messageDeleted);
    socket.on('groupChatCreated', events.groupChatCreated);
    socket.on('groupChatDeleted', events.groupChatDeleted);
    socket.on('chatMemberLeft', events.chatMemberLeft);
    socket.on('chatMemberAdded', events.chatMemberAdded);
    socket.on('chatMemberRemoved', events.chatMemberRemoved);
    socket.on('chatNameSet', events.chatNameSet);
    socket.on('chatCoverSet', events.chatCoverSet);
    socket.on('chatNicknameSet', events.chatNicknameSet);
    socket.on('chatMemberRankChanged', events.chatMemberRankChanged);
    socket.on('messageReactionsSet', events.messageReactionsSet);
    socket.on('userBlockStateChanged', events.userBlockStateChanged);
}

export class SocketWrapper {
    socket: Socket;
    cachedUsers = new Map<string, number|null>();

    constructor(socket: Socket, events: SocketEvents) {
        this.socket = socket;

        registerSocketEvents(socket, events);
    }

    searchChats(search: string) {
        return withTimeout<SearchResult>((resolve) => {
            this.socket.emit("searchChats", search, (res: SearchResult) => resolve(res));
        });
    }

    async getUserAvatarUrl(user: string) {
        if (!this.cachedUsers.has(user)) {
            const res = await withTimeout<(Attachment & { id: number })|null|undefined>((resolve) => {
                this.socket.emit("getUserAvatar", user, (result: (Attachment & { id: number })|null|undefined ) => resolve(result))
            }).catch(() => undefined);

            if (typeof res === "undefined") return 'default-user-avatar.png';
            else if (!res) {
                this.cachedUsers.set(user, null);
                return 'default-user-avatar.png';
            } else {
                this.cachedUsers.set(user, res.id);
                return cacheAttachment(res.id, res);
            }
        } else {
            const id = this.cachedUsers.get(user);
            if (!id) return 'default-user-avatar.png';

            return (await this.getAttachmentUrl(id).catch(() => 'default-user-avatar.png'))??'default-user-avatar.png';
        }
    }

    sendMessage(target: number|string, content: string|Attachment) {
        this.socket.emit("sendMessage", target, content);
    }

    getMessages(chatId: number, offset: number) {
        return withTimeout<Message[]>((resolve) => {
            this.socket.emit("getMessages", chatId, offset, (messages: Message[]) => resolve(messages));
        });
    }

    getAttachmentUrl(attachmentId: number) {
        return getCachedAttachment(attachmentId, () => withTimeout<Attachment>((resolve) => {
            this.socket.emit("getAttachment", attachmentId, (attachment: Attachment) => resolve(attachment));
        }));
    }

    deleteMessage(messageId: number) {
        this.socket.emit("deleteMessage", messageId);
    }

    createGroupChat(otherUsers: string[]) {
        this.socket.emit("createGroupChat", otherUsers);
    }

    deleteChat(chatId: number) {
        this.socket.emit("deleteChat", chatId);
    }

    leaveGroupChat(chatId: number) {
        this.socket.emit("leaveGroupChat", chatId);
    }

    addChatMember(chatId: number, user: string) {
        this.socket.emit("addChatMember", chatId, user);
    }

    removeChatMember(chatId: number, member: string) {
        this.socket.emit("removeChatMember", chatId, member);
    }

    getChatData(target: number|string) {
        return withTimeout<ChatData|null>((resolve) => {
            this.socket.emit("getChatData", target, (data: ChatData|null) => resolve(data));
        });
    }

    setChatName(chatId: number, chatName: string|null) {
        this.socket.emit("setChatName", chatId, chatName);
    }

    setChatCover(chatId: number, chatCover: Attachment|null) {
        this.socket.emit("setChatCover", chatId, chatCover);
    }

    setChatNickname(chatId: number, member: string, nickname: string|null) {
        this.socket.emit("setChatNickname", chatId, member, nickname);
    }

    changeChatMemberRank(chatId: number, member: string) {
        this.socket.emit("changeChatMemberRank", chatId, member);
    }

    changeUserBlockState(user: string) {
        return withTimeout<void>((resolve) => {
            this.socket.emit("changeUserBlockState", user, () => resolve());
        });
    }

    setMessageReaction(messageId: number, reactionId: number|null) {
        this.socket.emit("setMessageReaction", messageId, reactionId);
    }
}