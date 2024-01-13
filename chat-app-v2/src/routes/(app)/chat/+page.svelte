<script lang="ts">
    import { SocketWrapper } from "$lib/chat/socket-wrapper";
    import { afterUpdate, onDestroy } from "svelte";
    import type { PageData } from "../$types";
    import { io } from "socket.io-client";
    import { ChatTree, TempChat, type ChatView } from "$lib/chat/chat-view";
    import type { ChatMember, SearchResult } from "$lib/chat/types";
    import ChatList from "$lib/components/chat/chat-list.svelte";
    import { ChatListWrapper } from "$lib/chat/chat-list-wrapper";
    import UserAvatar from "$lib/components/user-avatar.svelte";
    import { getChatCover } from "$lib/utils/get-chat-cover";
    import MessageGroup from "$lib/components/chat/message-group.svelte";
    import AttachmentList from "$lib/components/chat/attachment-list.svelte";

    export let data: PageData;

    const socketUsername = data.session!.user.username;

    let chatTrees = new Map<number, ChatTree>();
    let chatList = new ChatListWrapper();
    let currentChat: ChatView|null = null;

    let isTabFocused = false;

    let searchValue: string;
    let searchTimer: NodeJS.Timeout;
    let searchResults: SearchResult|undefined;

    let includedAttachments: File[] = [];
    let draftMessageValue = '';

    let chatWindow: HTMLElement;
    let savedScrollTop = 0;
    let pendingMessageRequest = false;

    /*
    TODO:
    1. Updating chat data (cover, name etc.)
    2. Creating group chats
    3. Fixing image lag by adding width and height to the attachment object so there's no need for waiting for the image to load and then resize it
    
    4. Deleting messages    | Move message options to separate component and inject it at MessageBox/Attachment level instead at MessageGroup's level
    5. Reactions            |
    
    6. Clean up code (extract whats possible into components and classes)
    */

    const socket = new SocketWrapper(io("http://localhost:3000", { auth: { sessionId: data.session!.sessionId } }), {
        connected(chats) {
            // * when pushing reverse the array

            for (const c of chats) {
                const chatData = { chat: c.chat, members: c.members }
                const chat = new ChatTree(socketUsername, chatData);
                chat.pushMultiple(c.messages.reverse());

                chatTrees.set(c.chat.id, chat);
                chatList.push(chat);
            }

            chatList = chatList;
        },

        async messageReceived(message) {            
            const chat = (await getChat(message.chat_id))!; // ? a message always belongs to a chat
            chat.pushMessage(message);
            
            chatList.insertOrPushToFront(chat);
            chatList = chatList;

            playNotificationSound();
            
            if (currentChat && currentChat.id == message.chat_id) currentChat = currentChat;
            else if (currentChat instanceof TempChat && message.username == socketUsername) currentChat = chat;
        },

        messageDeleted(messageId, chatId) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.deleteMessage(messageId);
            });
        },

        groupChatCreated(chatData, systemMessage) {
            const chat = new ChatTree(socketUsername, chatData);
            chat.pushMessage(systemMessage);

            chatList.insertOrPushToFront(chat);
            chatList = chatList;

            chatTrees.set(chatData.chat.id, chat);
        },

        groupChatDeleted(chatId) {
            if (chatTrees.delete(chatId)) {
                chatList.delete(chatId);
                chatList = chatList;
                if (currentChat && currentChat.id == chatId) currentChat = null;
            }
        },

        chatMemberLeft(chatId, member, newOwner, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {                
                chat.deleteMember(member);

                if (newOwner) chat.members.find(m => m.username == newOwner)!.rank = 2;

                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            });
        },

        chatMemberAdded(chatId, member, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.push({ username: member, nickname: null, rank: 0 } as ChatMember);
                
                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            })
        },

        chatMemberRemoved(chatId, member, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.deleteMember(member);
                
                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            });
        },

        chatNameSet(chatId, chatName, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.data.chat.name = chatName;
                
                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            })
        },

        chatCoverSet(chatId, coverId, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.data.chat.cover_id = coverId;
                
                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            })
        },

        chatNicknameSet(chatId, member, nickname, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.find(m => m.username == member)!.nickname = nickname;
                
                chatList.insertOrPushToFront(chat);

                chat.pushMessage(systemMessage);
            });
        },

        chatMemberRankChanged(chatId, member, rank, systemMessage) {
            getChatOrCallbackIfExists(chatId, chat => {
                chat.members.find(m => m.username == member)!.rank = rank;
                
                chatList.insertOrPushToFront(chat);

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

    $: {
        if (searchValue) {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(search, 1000);
        } else searchResults = undefined;
    }

    onDestroy(() => {
        socket.dispose();
    });

    afterUpdate(() => {
        if (chatWindow) {
            chatWindow.scrollTop = savedScrollTop;
            chatWindow = chatWindow;
        }
    })

    async function search() {
        const results = await socket.searchChats(searchValue);
        if (searchValue) searchResults = results;
    }

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
            
            chatList = chatList;
            if (currentChat && currentChat.id == chatId) currentChat = currentChat;
        }
        else socket.getChatData(chatId).then(d => {
            if (!d) return;

            chatTrees.set(chatId, new ChatTree(socketUsername, d));
            chatList = chatList;
        })
    }

    function getCover(coverId: number|null|string) {
        return getChatCover(coverId, socket.attachmentHandler);
    }

    function playNotificationSound() {
        if (!isTabFocused) new Audio("audio/notification.mp3").play();
    }

    async function openChat(ev: CustomEvent) {    
        const target = ev.detail;
        
        if (currentChat && currentChat.id === target) return;

        if (typeof target === "string") {
            currentChat = new TempChat(target); 
        } else {
            const chat = await getChat(target);
            
            if (!chat) {
                console.error("Could not find the chat!");
                return;
            }

            currentChat = chat;
        }
    }

    function onDrop(e: DragEvent) {                
        e.preventDefault();
        
        if (e.dataTransfer) {
            [...e.dataTransfer.items].forEach(i => {
                if (i.kind == "file") {
                    const file = i.getAsFile()!;
                    includedAttachments.push(file);
                }
            }) 

            includedAttachments = includedAttachments;
        }
    }

    async function sendMessage() {
        if (!currentChat) return;

        if (draftMessageValue) socket.sendMessage(currentChat.id, draftMessageValue);
        
        if (includedAttachments.length > 0) {
            for (const i of includedAttachments) {
                socket.sendMessage(currentChat.id, { buffer: i as unknown as Buffer, type: i.type, name: i.name })
            }
        }

        includedAttachments = [];
        draftMessageValue = '';
    }

    async function onChatScroll(e: Event) {
        savedScrollTop = chatWindow.scrollTop;

        if (pendingMessageRequest) return;

        if ((chatWindow.scrollTop * -1 + chatWindow.clientHeight) == chatWindow.scrollHeight) {
            const chat = currentChat as ChatTree; // temp chat is not scrollable

            if (chat.hasFullHistory) return;

            pendingMessageRequest = true;
            const messages = await socket.getMessages(chat.id, chat.count);

            if (messages.length == 0) {
                chat.hasFullHistory = true;
                pendingMessageRequest = false;
                return;
            } else {
                const c = await getChat(chat.id);
                if (!c) {
                    console.error('Something went wrong while loading chat history!');
                    return;
                }

                c.insertMultiple(messages);
            }

            currentChat = currentChat;
            pendingMessageRequest = false;
        }
    }
</script>

<svelte:window on:focus={() => isTabFocused = true} on:blur={() => isTabFocused = false} />

<div class="absolute w-full h-full flex">
    <div id="chat-list" class="relative w-96 mt-14 flex flex-col shadow-lg overflow-y-auto">
        <div class="w-full p-4">
            <h1 class="text-3xl text-gradient">Chats</h1>
            <input type="search" placeholder="Search..." class="w-full mt-2 px-4 py-2 border-2 focus:outline-none rounded-full" bind:value={searchValue}/>
        </div>

        <div class="relative p-4 flex-1">
            {#if !searchValue && chatList.empty}
            <h1 class="center-text-placeholder">Future chats will be displayed here</h1>
            {:else}
                {#if searchValue}
                    {#if searchResults}
                    <ChatList items={searchResults} attachmentHandler={socket.attachmentHandler} on:onItemClick={openChat}/>
                    {/if}
                {:else}
                <ChatList items={chatList.array} attachmentHandler={socket.attachmentHandler} on:onItemClick={openChat}/>
                {/if}
            {/if}
        </div>
    </div>

    <div class="relative flex-1 mt-14 flex flex-col p-4">
        {#if currentChat}
        <div class="w-full h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <UserAvatar size={44} urlPromise={getCover(currentChat.chatCover)} />
                <h1 class="text-xl">{currentChat.displayName}</h1>
            </div>

            <button class="bg-none hover:bg-gray-100 active:bg-gray-200 transition-all rounded-full">
                <img src="icons/more.svg" alt="chat options" class="p-2" />
            </button>
        </div>

        <div class="flex-1 flex flex-col-reverse gap-2 overflow-y-auto pr-1 overscroll-y-none" role="feed" bind:this={chatWindow} on:scroll={onChatScroll} on:dragover|preventDefault on:drop={onDrop}>            
            {#each currentChat.messageGroups as group (group.id)}
            <MessageGroup {group} attachmentHandler={socket.attachmentHandler} {socketUsername} on:deleteMessage on:deleteMessage />
            {/each}
        </div>

        <div class="w-full">
            <AttachmentList bind:attachments={includedAttachments} />

            <div class="w-full h-16 flex gap-2 items-center">
                <input type="text" placeholder="Write a message" class="flex-1 px-4 py-2 border-2 focus:outline-none rounded-full" bind:value={draftMessageValue} on:keydown={e => {
                    if (e.key == "Enter") sendMessage();
                }} />
    
                <button class="p-2 main-gradient rounded-full" on:click={sendMessage}>
                    <img src="icons/send.svg" alt="send" />
                </button>
            </div>
        </div>
        {:else}
        <h1 class="center-text-placeholder">No chat opened</h1>
        {/if}
    </div>
</div>