<script lang="ts">
    import type { PageData } from "./$types";
    import { io } from "socket.io-client";
    import type { Chat, Message, ChatMember, SearchResult } from "$lib/chat/types";
    import { ChatTree } from "$lib/chat/chat-tree";
    import { onDestroy } from "svelte";
    import ChatListItem from "$lib/components/chat/chat-list-item.svelte";
    import { TempChatTree } from "$lib/chat/temp-chat-tree";
    import ChatCover from "$lib/components/chat/chat-cover.svelte";
    import type { IChatTree } from "$lib/chat/ichat-tree";
    import MessageBox from "$lib/components/chat/message-box.svelte";

    const ATTACHMENT_REQUEST_TIMEOUT_TIME = 5000; // ? 5s

    export let data: PageData;

    let chats = new Map<number, ChatTree>();
    let attachments = new Map<number, string>();

    let currentChat: IChatTree|undefined;

    let searchValue = '';
    let searchTimer: NodeJS.Timeout;
    let searchResults: SearchResult|undefined;

    let messageValue = '';

    $: {
        if (searchValue) {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(search, 1000);
        }
    }

    // TODO: handle attachments
    // TODO: load messages

    const socket = io("http://localhost:3000", {
        auth: {
            sessionId: data.sessionId
        }
    }); 

    onDestroy(() => {
        socket.disconnect();
    });

    //#region 
    socket.on('connected', (data: { chat: Chat, members: ChatMember[], messages: Message[] }[]) => {
        console.log(data);
        
        for (const d of data) {
            const chat = new ChatTree(d.chat, d.members);
            chat.insertMessages(d.messages);
            chats.set(d.chat.id, chat);
        }

        chats = chats;
    });

    // ? socket io sends objects as maps?

    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions
    // TODO: refactor and fix all of these functions

    socket.on('messageReceived', (response: any[]) => {
        console.log('messageReceived');
        
        const message = response[0] as Message;

        console.log(message);

        getChat(message.chat_id, (c, _) => {
            console.log('inserting message');

            if (c.data.private && currentChat instanceof TempChatTree) {
                const other = c.members[0].username == data.user.username? c.members[1] : c.members[0];
                if (currentChat.getName(data.user.username) == other.username) currentChat = c;
            }
            
            c.insertMessage(message)
        });

        currentChat = currentChat;
    });

    socket.on('messageDeleted', (messageId: number, chatId: number) => {
        chats.get(chatId)?.deleteMessage(messageId);
    });

    socket.on('groupChatCreated', (data: { chat: Chat, members: ChatMember[] }) => {
        chats.set(data.chat.id, new ChatTree(data.chat, data.members));
    });

    socket.on('groupChatDeleted', (chatId: number) => {
        chats.delete(chatId);
    });

    socket.on('chatMemberLeft', (chatId: number, member: string, newOwner: string|undefined) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            
            c.members.splice(c.members.findIndex(m => m.username === member), 1);

            if (!newOwner) return;

            c.members.find(m => m.username === newOwner)!.rank = 2;
        })
    });

    socket.on('chatMemberAdded', (chatId: number, member: string, addedMember: string) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.members.push({ username: addedMember, rank: 0 });
        });
    });

    socket.on('chatMemberRemoved', (chatId: number, member: string, removedMember: string) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.members.splice(c.members.findIndex(m => m.username === removedMember), 1);
        });
    });

    socket.on('chatNameSet', (chatId: number, member: string, chatName: string|null) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.data.name = chatName;
        });
    });

    socket.on('chatCoverSet', (chatId: number, member: string, coverId: number|null) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.data.cover_id = coverId;
        });
    });

    socket.on('chatNicknameSet', (chatId: number, member: string, otherMember: string, nickanme: string|null) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.members.find(m => m.username === otherMember)!.nickname = nickanme;
        });
    });

    socket.on('chatRankChanged', (chatId: number, member: string, otherMember: string, rank: number) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;
            c.members.find(m => m.username === otherMember)!.rank = rank;
        });
    });

    socket.on('userBlockStateChanged', (member: string, state: boolean) => {
        // TODO: Implement
    });

    socket.on('messageReactionsSet', (chatId: number, member: string, messageId: number, reactions: string) => {
        getChat(chatId, (c, newChat) => {
            if (newChat) return;

            const message = c.findMessage(messageId);
            if (message) message.reactions = reactions;
        });
    });
    //#endregion

    function getChat(chatId: number, callback: (chat: ChatTree, newChat: boolean) => void) {       
        // ! problem 1: getChatdata does not return a response
        // ! problem 2: chats does not contain chat id

        console.log(chats);
        console.log(chatId);
        console.log(chats.has(chatId));
        
        if (!chats.has(chatId)) {
            socket.emit('getChatData', chatId, (data: { chat: Chat, members: ChatMember[] }) => {
                if (!data) {
                    console.error('something went terribly wrong');
                    return;
                }

                const chat = new ChatTree(data.chat, data.members);
                chats.set(chatId, chat);

                callback(chat, true);
            })
        } else {
            callback(chats.get(chatId)!, false);
        }

        chats = chats;
    }

    function search() {
        socket.emit("searchChats", searchValue, (results: SearchResult) => {
            searchResults = results;
        });
    }

    function getSortedChatList(map: Map<number, ChatTree>) {
        return Array.from(map.values()).sort((a, b) => {
            if (!a.firstMessage) {
                if (!b.firstMessage) return 0;
                else return -1;
            } else if (!b.firstMessage) {
                if (!a.firstMessage) return 0;
                else return 1;
            } else return a.firstMessage.message.id > b.firstMessage.message.id? -1 : 1;
        })
    }

    function getAttachment(id: number) {    
        return new Promise<string>((resolve, reject) => {
            if (attachments.has(id)) return resolve(attachments.get(id)!);

            const timeout = setTimeout(reject, ATTACHMENT_REQUEST_TIMEOUT_TIME);
            
            socket.emit('getAttachment', id, (attachment: Blob|null) => {
                clearTimeout(timeout);
                if (!attachment) return reject();
                
                const url = window.URL.createObjectURL(attachment);
                attachments.set(id, url);
 
                resolve(url);
            })
        })
    }

    const DEFAULT_CHAT_COVER_URL = "default-chat-cover.png";

    async function getChatCover(source?: ChatTree|number|null) {
        if (!source) return DEFAULT_CHAT_COVER_URL;
        else if (typeof source === "number") {
            return getAttachment(source).catch(() => DEFAULT_CHAT_COVER_URL);
        }
        else if (source.data.private == 1) {
            const avatarId = source.members[0].username == data.user.username? source.members[1].avatar_id : source.members[0].avatar_id;
            if (!avatarId) return DEFAULT_CHAT_COVER_URL;

            return getAttachment(avatarId).catch(() => DEFAULT_CHAT_COVER_URL);
        } else {
            if (!source.data.cover_id) return DEFAULT_CHAT_COVER_URL;

            return getAttachment(source.data.cover_id).catch(() => DEFAULT_CHAT_COVER_URL);;
        }
    }

    function openChat(id: number) {
        if (!chats.has(id)) {
            getChat(id, (chat, _) => currentChat = chat);
        } else currentChat = chats.get(id);
    }

    function openPrivateChat(otherUsername: string, coverId: number|null) {
        socket.emit('getPrivateChatData', otherUsername, (data: { chat: Chat, members: ChatMember[] }) => {
            if (!data) currentChat = new TempChatTree(otherUsername, coverId);
            else {
                const chat = new ChatTree(data.chat, data.members);
                chats.set(chat.data.id, chat);

                chats = chats;
                currentChat = chat;
            }
        });
    }

    function sendMessage() {
        if (!messageValue || !currentChat) return;

        console.log('sentMessage')
        socket.emit('sendMessage', currentChat.getId(), messageValue);
    }
</script>

<div class="absolute top-0 left-0 w-full h-full flex">
    <!--Left bar-->
    <div class="flex flex-col items-center w-80 m-5 border-2 border-indigo-500 rounded-2xl">
        <!--Search-->
        <input placeholder="Search" class="w-[90%] mt-4 px-4 py-2 border-2 border-indigo-500 rounded-3xl outline-none focus:border-indigo-800 transition-all" bind:value={searchValue}/>

        <!--List-->
        <div class="relative w-[90%] my-5 flex-1 flex flex-col gap-2 overflow-y-auto">      
            {#if searchValue}
            {#if searchResults}
            
                {#each searchResults.users as u}
                <ChatListItem chatCoverUrl={getChatCover(u.avatar_id)} name={u.username} onClick={() => openPrivateChat(u.username, u.avatar_id)}/>
                {/each}

                {#if searchResults.chats}
                {#each searchResults.chats as c}
                <ChatListItem chatCoverUrl={getChatCover(c.cover_id)} name={c.name} onClick={() => openChat(c.id)}/>
                {/each}
                {/if}

            {/if}
            {:else}
                {#if chats.size == 0}
                <h1 class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none">No chats found {":("}</h1> <!--to fix highliting error-->
                {:else}

                {#each getSortedChatList(chats) as c}
                <ChatListItem chatCoverUrl={getChatCover(c)} name={c.getName(data.user.username)} onClick={() => openChat(c.data.id)}>
                    <svelte:fragment slot="content">
                        {#if c.firstMessage}
                        <div class="flex content-between text-sm text-gray-400">
                            <h2 class="overflow-ellipsis overflow-hidden whitespace-nowrap flex-1">{c.firstMessagePreview}</h2>
                            <h2 class="ml-1 mr-2">{new Date(c.firstMessage.message.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</h2>
                        </div>
                        {:else}
                        <h2 class="text-sm text-gray-400 overflow-ellipsis overflow-hidden whitespace-nowrap">Chat started</h2>
                        {/if}  
                    </svelte:fragment>
                </ChatListItem>
                {/each}
                
                {/if}
            {/if}
        </div>
    </div>

    <!--Chat-->
    <div class="flex-1 m-5 border-2 border-indigo-500 rounded-2xl flex flex-col">        
        <!--TopBar-->
        {#if currentChat}
        <div class="w-full h-16 border-b-2 border-b-indigo-500 flex items-center pl-2">
            <ChatCover urlPromise={getChatCover(currentChat.getCoverId())}/>
            <h1 class="text-lg">{currentChat.getName(data.user.username)}</h1>
        </div>

        <!--Chat-->
        <div class="w-full flex-1 overflow-y-auto p-2">
            {#each currentChat.toArray() as m}
            <MessageBox content={m.content} onDelete={m.username == data.user.username? () => { 
                socket.emit('deleteMessage', m.id);
            } : undefined }/>
            {/each}
        </div>

        <!--MessageBox-->
        <div class="w-full h-16 border-t-2 border-t-indigo-500 flex p-2 gap-2">
            <input type="text" placeholder="Write a message!" autocomplete="off" class="rounded-2xl flex-1 p-2 border-2 border-gray-400" bind:value={messageValue}/>
            <button class="bg-indigo-500 text-white p-2 rounded-2xl" on:click={sendMessage}>
                Send
            </button>
        </div>
        {/if}
    </div>
</div>