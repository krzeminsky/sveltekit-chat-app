<script lang="ts">
    import type { PageData } from "./$types";
    import { io } from "socket.io-client";
    import type { Chat, Message, ChatMember, SearchResult } from "$lib/chat/types";
    import { ChatTree } from "$lib/chat/chat-tree";
    import { onDestroy } from "svelte";

    const ATTACHMENT_REQUEST_TIMEOUT_TIME = 5000; // ? 5s

    export let data: PageData;

    let chats = new Map<number, ChatTree>();
    let attachments = new Map<number, string>();

    let searchValue = '';
    let searchTimer: NodeJS.Timeout;
    let searchResults: SearchResult|undefined;

    $: {
        if (searchValue) {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(search, 2000);
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
        for (const d of data) {
            chats.set(d.chat.id, new ChatTree(d.chat, d.members));
        }
    });

    socket.on('messageReceived', (message: Message) => {
        getChat(message.chat_id, (c) => c.insertMessage(message));
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
        } else callback(chats.get(chatId)!, false);

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

    async function getChatCover(chat: ChatTree) {
        if (chat.data.private == 1) {
            const avatarId = chat.members[0].username == data.user.username? chat.members[1].avatar_id : chat.members[0].avatar_id;
            if (!avatarId) return 'default_avatar.png';

            return getAttachment(avatarId).catch(() => "default_avatar.png");
        } else {
            if (!chat.data.cover_id) return 'default_avatar.png';

            return getAttachment(chat.data.cover_id).catch(() => "default_avatar.png");;
        }
    }

    async function getAttachmentsAsChatCover(id?: number|null) {
        if (!id) return 'default_avatar.png';
        
        return getAttachment(id).catch(() => "default_avatar.png");
    }
</script>

<div class="absolute top-0 left-0 w-full h-full flex">
    <!--Left bar-->
    <div class="flex flex-col items-center w-80 m-5 border-2 border-indigo-500 rounded-2xl">
        <!--Search-->
        <input placeholder="Search" class="w-[90%] mt-4 px-4 py-2 border-2 border-indigo-500 rounded-3xl outline-none focus:border-indigo-800 transition-all" bind:value={searchValue}/>

        <!--List-->
        <div class="relative w-[90%] my-5 flex-1 flex flex-col gap-2 overflow-y-auto">
            <!--! MY FUCKING EYES-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            <!--TODO: EXTRACT INTO COMPONENTS-->
            
            {#if searchValue}
            {#if searchResults}
            
                {#each searchResults.users as u}
                <div class="w-full h-16">
                    {#await getAttachmentsAsChatCover(u.avatar_id)}
                    <div class="w-14 h-14">
                        <div role="status" class="relative"> <!--Copied from submit-button-->
                            <svg aria-hidden="true" class="w-6 h-6 mx-auto my-auto text-transparent animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                        </div>
                    </div>
                    {:then src}
                    <img {src} alt="avatar" class="rounded-full h-14 m-1 mr-2 float-left"/>
                    {/await}

                    <h1 class="text-lg overflow-ellipsis overflow-hidden whitespace-nowrap h-16 leading-[64px]">{u.username}</h1>
                </div>
                {/each}

                {#if searchResults.chats}
                {#each searchResults.chats as c}
                <div class="w-full h-16">
                    {#await getAttachmentsAsChatCover(c.cover_id)}
                    <div class="w-14 h-14">
                        <div role="status" class="relative"> <!--Copied from submit-button-->
                            <svg aria-hidden="true" class="w-6 h-6 mx-auto my-auto text-transparent animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                        </div>
                    </div>
                    {:then src}
                    <img {src} alt="avatar" class="rounded-full h-14 m-1 mr-2 float-left"/>
                    {/await}

                    <h1 class="text-lg overflow-ellipsis overflow-hidden whitespace-nowrap h-16 leading-[64px]">{c.name}</h1>
                </div>
                {/each}
                {/if}

            {/if}
            {:else}
                {#if chats.size == 0}
                <p class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none">No chats found {":("}</p> <!--to fix highliting error-->
                {:else}

                {#each getSortedChatList(chats) as c}
                <div class="w-full h-16">
                    {#await getChatCover(c)}
                    <div class="w-14 h-14">
                        <div role="status" class="relative"> <!--Copied from submit-button-->
                            <svg aria-hidden="true" class="w-6 h-6 mx-auto my-auto text-transparent animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                            </svg>
                        </div>
                    </div>
                    {:then src}
                    <img {src} alt="avatar" class="rounded-full h-14 m-1 mr-2 float-left"/>
                    {/await}

                    <div>
                        <h1 class="text-lg overflow-ellipsis overflow-hidden whitespace-nowrap">{c.name}</h1>
                        
                        {#if c.firstMessage}
                        <div class="flex content-between text-sm text-gray-400">
                            <h2 class="overflow-ellipsis overflow-hidden whitespace-nowrap flex-1">{c.firstMessagePreview}</h2>
                            <h2 class="ml-1">{new Date(c.firstMessage.message.timestamp).toLocaleString()}</h2>
                        </div>
                        {:else}
                        <h2 class="text-sm text-gray-400 overflow-ellipsis overflow-hidden whitespace-nowrap">Chat started</h2>
                        {/if}
                    </div>
                </div>
                {/each}
                
                {/if}
            {/if}
        </div>
    </div>

    <!--Chat-->
    <div class="flex-1 m-5 border-2 border-indigo-500 rounded-2xl">

    </div>
</div>