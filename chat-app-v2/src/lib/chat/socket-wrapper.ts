import type { Socket } from "socket.io-client";
import type { Chat, ChatData, ChatMember, Message, SearchResult } from "./types";
import { type Attachment } from "../attachment-cache";
import { withTimeout } from "$lib/utils/with-timeout";
import { SocketAttachmentHandler } from "./socket-attachment-handler";

type SocketEvents = {
    connected: (chatData: { chat: Chat, members: ChatMember[], messages: Message[] }[]) => void;
    messageReceived: (message: Message) => void;
    messageDeleted: (messageId: number, chatId: number) => void;
    groupChatCreated: (chatData: ChatData, systemMessage: Message) => void;
    groupChatDeleted: (chatId: number) => void;
    chatMemberLeft: (chatId: number, member: string, newOwner: string|undefined, systemMessage: Message) => void;
    chatMemberAdded: (chatId: number, member: string, systemMessage: Message) => void;
    chatMemberRemoved: (chatId: number, member: string, systemMessage: Message) => void;
    chatNameSet: (chatId: number, chatName: string|null, systemMessage: Message) => void;
    chatCoverSet: (chatId: number, coverId: number|null, systemMessage: Message) => void;
    chatNicknameSet: (chatId: number, member: string, nickname: string|null, systemMessage: Message) => void;
    chatMemberRankChanged: (chatId: number, member: string, rank: number, systemMessage: Message) => void;
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
    attachmentHandler: SocketAttachmentHandler;

    constructor(socket: Socket, events: SocketEvents) {
        this.socket = socket;
        this.attachmentHandler = new SocketAttachmentHandler(socket);

        registerSocketEvents(socket, events);
    }

    dispose() {
        this.socket.disconnect();
    }

    search(search: string, includeChats: boolean) {
        return withTimeout<SearchResult>((resolve) => {
            this.socket.emit("search", search, includeChats, (res: SearchResult) => resolve(res));
        });
    }

    sendMessage(target: number|string, content: string|Attachment) {
        this.socket.emit("sendMessage", target, content);
    }

    getMessages(chatId: number, offset: number) {
        return withTimeout<Message[]>(resolve => {
            this.socket.emit("getMessages", chatId, offset, (messages: Message[]) => resolve(messages));
        });
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
        return withTimeout<ChatData|null>(resolve => {
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
        return withTimeout<void>(resolve => {
            this.socket.emit("changeUserBlockState", user, () => resolve());
        });
    }

    setMessageReaction(messageId: number, reactionId: number|null) {
        this.socket.emit("setMessageReaction", messageId, reactionId);
    }
}