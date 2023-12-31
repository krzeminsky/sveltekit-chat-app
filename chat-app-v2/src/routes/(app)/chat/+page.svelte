<script lang="ts">
    import { SocketWrapper } from "$lib/chat/socket-wrapper";
    import { onDestroy } from "svelte";
    import type { PageData } from "../$types";
    import { io } from "socket.io-client";
    import { ChatTree, type ChatView } from "$lib/chat/chat-view";
    import type { ChatMember } from "$lib/chat/types";

    export let data: PageData;

    const socketUsername = data.session!.user.username;

    let chatTrees = new Map<number, ChatTree>();
    let currentChat: ChatView|null = null;


    const socket = new SocketWrapper(io("http://localhost:3000", { auth: { sessionId: data.session!.sessionId } }), {
        connected(chats) {
            // * when pushing reverse the array

            for (const c of chats) {
                const chat = new ChatTree(socketUsername, c);
                chat.pushMultiple(c.messages.reverse());

                chatTrees.set(c.chat.id, chat);
            }

            chatTrees = chatTrees;
        },

        async messageReceived(message) {
            const chat = (await getChat(message.chat_id))!; // ? a message always belongs to a chat
            chat.pushMessage(message);
            playNotificationSound();
            
            chatTrees = chatTrees;
            if (currentChat && currentChat.id == message.chat_id) currentChat = currentChat;
        },

        messageDeleted(messageId, chatId) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.deleteMessage(messageId);
            });
        },

        groupChatCreated(chatData, systemMessage) {
            const chat = new ChatTree(socketUsername, chatData);
            chat.pushMessage(systemMessage);

            chatTrees.set(chatData.chat.id, chat);
            chatTrees = chatTrees;
        },

        groupChatDeleted(chatId) {
            if (chatTrees.delete(chatId)) {
                chatTrees = chatTrees;
                if (currentChat && currentChat.id == chatId) currentChat = null;
            }
        },

        chatMemberLeft(chatId, member, newOwner, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {                
                chat.deleteMember(member);

                if (newOwner) chat.members.find(m => m.username == newOwner)!.rank = 2;

                chat.pushMessage(systemMessage);
            });
        },

        chatMemberAdded(chatId, member, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.push({ username: member, nickname: null, rank: 0 } as ChatMember);
                chat.pushMessage(systemMessage);
            })
        },

        chatMemberRemoved(chatId, member, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.deleteMember(member);
                chat.pushMessage(systemMessage);
            });
        },

        chatNameSet(chatId, chatName, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.data.chat.name = chatName;
                chat.pushMessage(systemMessage);
            })
        },

        chatCoverSet(chatId, coverId, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.data.chat.cover_id = coverId;
                chat.pushMessage(systemMessage);
            })
        },

        chatNicknameSet(chatId, member, nickname, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.find(m => m.username == member)!.nickname = nickname;
                chat.pushMessage(systemMessage);
            });
        },

        chatMemberRankChanged(chatId, member, rank, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.find(m => m.username == member)!.rank = rank;
                chat.pushMessage(systemMessage);
            })
        },

        messageReactionsSet(chatId, messageId, reactions) {
            getChatOrCallbackIfExists(chatId, chat => {
                const message = chat.findMessage(messageId);
                if (message) message.reactions = reactions;
            })
        },

        userBlockStateChanged(user, state) {
            throw Error("Not implemented");
        },
    });

    onDestroy(() => {
        socket.dispose();
    });

    async function getChat(chatId: number) {
        if (chatTrees.has(chatId)) return chatTrees.get(chatId)!;
        else {
            const chatData = await socket.getChatData(chatId);
            if (!chatData) return null;

            const chat = new ChatTree(socketUsername, chatData);
            chatTrees.set(chatId, chat);

            return chat;
        }
    }

    function getChatOrCallbackIfExists(chatId: number, onExists: (chat: ChatTree) => void) {
        if (chatTrees.has(chatId)) {
            onExists(chatTrees.get(chatId)!);
            
            chatTrees = chatTrees;
            if (currentChat && currentChat.id == chatId) currentChat = currentChat;
        }
        else socket.getChatData(chatId).then(d => {
            if (!d) return;

            chatTrees.set(chatId, new ChatTree(socketUsername, d));
            chatTrees = chatTrees;
        })
    }

    async function getChatCover(coverId: number|null|string) {
        if (typeof coverId === "string") return socket.attachmentHandler.getUserAvatar(coverId);
        else if (!coverId) return 'default-user-avatar.png';
        else return socket.attachmentHandler.getAttachment(coverId);
    }

    function playNotificationSound() {

    }
</script>