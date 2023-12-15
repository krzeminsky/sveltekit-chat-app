<script lang="ts">
    import type { PageData } from "./$types";
    import { io } from "socket.io-client";
    import type { Chat, Message, ChatMember, SearchResult } from "$lib/chat/types";
    import { ChatTree } from "$lib/chat/chat-tree";
    import { afterUpdate, onDestroy } from "svelte";
    import ChatListItem from "$lib/components/chat/chat-list-item.svelte";
    import { TempChatTree } from "$lib/chat/temp-chat-tree";
    import ChatCover from "$lib/components/chat/chat-cover.svelte";
    import { isChatTree, type IChatTree } from "$lib/chat/ichat-tree";
    import MessageBox from "$lib/components/chat/message-box.svelte";

    const REQUEST_TIMEOUT_TIME = 5000; // ? 5s

    export let data: PageData;

    let chats = new Map<number, ChatTree>();
    let attachments = new Map<number, string>();

    let currentChat: IChatTree|undefined;

    let searchValue = '';
    let searchTimer: NodeJS.Timeout;
    let searchResults: SearchResult|undefined;

    let messageValue = '';

    let chatWindow: HTMLElement;
    let pendingMessageRequest = false;

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
        },
    }); 

    onDestroy(() => {
        socket.disconnect();
    });

    //#region 
    socket.on('connected', async (data: { chat: Chat, members: ChatMember[], messages: Message[] }[]) => {                 
        for (const d of data) {
            const chat = new ChatTree(d.chat, d.members);
            chat.insertMessages(d.messages);
            chats.set(d.chat.id, chat);
        }

        chats = chats;
    });

    socket.on('messageReceived', (message: Message) => {    
        getChat(message.chat_id, (c, _) => {
            if (c.data.private && currentChat instanceof TempChatTree) {
                const other = c.members[0].username == data.user.username? c.members[1] : c.members[0];
                if (currentChat.getName(data.user.username) == other.username) currentChat = c;
            }
            
            c.pushMessage(message)
        });

        currentChat = currentChat;
    });

    socket.on('messageDeleted', (messageId: number, chatId: number) => {
        getChat(chatId, (c, _) => {
            c.deleteMessage(messageId);
        })

        currentChat = currentChat;
    });

    socket.on('groupChatCreated', (data: { chat: Chat, members: ChatMember[] }) => {
        chats.set(data.chat.id, new ChatTree(data.chat, data.members));
        chats = chats;
    });

    socket.on('groupChatDeleted', (chatId: number) => {
        chats.delete(chatId);
        chats = chats;
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
        if (!chats.has(chatId)) {
            socket.emit('getChatData', chatId, (data: { chat: Chat, members: ChatMember[] }) => {
                if (!data) {
                    console.error('something went terribly wrong');
                    return;
                }

                const chat = new ChatTree(data.chat, data.members);
                chats.set(chatId, chat);

                callback(chat, true);
                chats = chats;
            })
        } else {
            callback(chats.get(chatId)!, false);
            chats = chats;
        }
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

    const DEFAULT_CHAT_COVER_URL = "default-chat-cover.png"; 

    async function getAttachment(id: number) {        
        return new Promise<string>((resolve, reject) => {
            if (attachments.has(id)) {
                return resolve(attachments.get(id)!);
            }

            let timedOut = false;
            const timeout = setTimeout(() => { reject(); timedOut = true; }, REQUEST_TIMEOUT_TIME);

            // ? For some reason, sending a blob in an acknowledgment, causes the websocket server/client to go completely haywire
            socket.emit('getAttachment', id, (data: { buffer: Buffer, type: string }|null) => { 
                if (timedOut || !data) return;

                clearTimeout(timeout);
                
                const blob = new Blob([data.buffer], { type: data.type})
                const url = window.URL.createObjectURL(blob);
                attachments.set(id, url);

                resolve(url);
            })
        });
    }

    async function getChatCover(source?: IChatTree|number|null) {
        if (!source) {
            return DEFAULT_CHAT_COVER_URL;
        } else if (isChatTree(source)) {
            const id = source.getCoverId(data.user.username);
            if (!id) return DEFAULT_CHAT_COVER_URL;

            return getAttachment(id);
        } else {
            return getAttachment(source);
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

        socket.emit('sendMessage', currentChat.getId(), messageValue);
        messageValue = '';
    }

    // TODO: fix scrolling
    async function onChatScroll(e: Event) {
        if (pendingMessageRequest) return;

        if ((chatWindow.scrollTop * -1 + chatWindow.clientHeight) > 0.9 * chatWindow.scrollHeight) {
            const chat = currentChat as ChatTree; // temp chat is not scrollable

            new Promise<void>((resolve, reject) => {
                pendingMessageRequest = true;

                let timedOut = false;
                const timeout = setTimeout(() => {
                        reject(); 
                        timedOut = true; 
                        pendingMessageRequest = false; 
                    }, 
                    REQUEST_TIMEOUT_TIME
                );
                
                socket.emit("getMessages", chat.data.id, chat.count, (messages: Message[]) => {
                    if (timedOut) return;
                    clearTimeout(timeout);
                    if (messages.length == 0) return; // * DEBUG DEBUG DEBUG

                    getChat(chat.data.id, (c, _) => {
                        c.insertMessages(messages);
                    });

                    currentChat = currentChat;

                    resolve();
                    pendingMessageRequest = false;
                });
            })
        }
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
                        {#if c.lastMessage}
                        <div class="flex content-between text-sm text-gray-400">
                            <h2 class="overflow-ellipsis overflow-hidden whitespace-nowrap flex-1">{c.firstMessagePreview}</h2>
                            <h2 class="ml-1 mr-2">{new Date(c.lastMessage.message.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</h2>
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
            <ChatCover urlPromise={getChatCover(currentChat)}/>
            <h1 class="text-lg">{currentChat.getName(data.user.username)}</h1>
        </div>

        <!--Chat-->
        <div class="w-full flex-1 p-2 flex flex-col-reverse gap-1 overflow-y-auto" bind:this={chatWindow} on:scroll={onChatScroll}>
            <!--This shi is a mess, improve it in client v2-->
            {#each currentChat.toArray().reverse() as m (m.id)}
            <MessageBox content={m.content} onDelete={m.username == data.user.username? () => { 
                socket.emit('deleteMessage', m.id);
            } : undefined }/>
            {/each}
        </div>

        <!--MessageBox-->
        <div class="w-full h-16 border-t-2 border-t-indigo-500 flex p-2 gap-2">
            <input type="text" placeholder="Write a message!" autocomplete="off" class="rounded-2xl flex-1 p-2 border-2 border-gray-400" bind:value={messageValue} on:keydown={e => { if (e.key == "Enter") sendMessage() }}/>
            <button class="bg-indigo-500 text-white p-2 rounded-2xl" on:click={sendMessage}>
                Send
            </button>
        </div>
        {/if}
    </div>
</div>