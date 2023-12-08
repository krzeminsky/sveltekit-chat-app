<script lang="ts">
    import type { PageData } from "./$types";
    import { io } from "socket.io-client";
    import type { Chat, Message, ChatMember, SearchResult } from "$lib/chat/types";
    import { ChatTree } from "$lib/chat/chat-tree";
    import { onDestroy } from "svelte";

    export let data: PageData;

    let chats = new Map<number, ChatTree>();
    let attachments = new Map<number, string>();

    let searchValue = '';
    let searchTimer: NodeJS.Timeout;
    let searchResults: SearchResult;

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
            
            socket.emit('getAttachment', id, (attachment: Blob|null) => {
                if (!attachment) return reject();
                
                const url = window.URL.createObjectURL(attachment);
                attachments.set(id, url);

                resolve(url);
            })
        })
    }

    function getChatCover(chat: ChatTree) {
        if (chat.data.private == 1) {
            const avatarId = chat.members.find(m => m.username !== data.user.username)!.avatar_id;
            if (!avatarId) throw Error(); // TODO: implement default avatar pic

            return getAttachment(avatarId);
        } else {
            if (!chat.data.cover_id) throw Error(); // TODO: implement default gc pic -> first member avatar, smaller second member avatar in the corner
            
            return getAttachment(chat.data.cover_id);
        }
    }
</script>

<div class="absolute top-0 left-0 w-full h-full flex">
    <!--Left bar-->
    <div class="flex flex-col items-center w-80 m-5 border-2 border-indigo-500 rounded-2xl">
        <!--Search-->
        <input placeholder="Search" class="w-[90%] mt-4 px-4 py-2 border-2 border-indigo-500 rounded-3xl outline-none focus:border-indigo-800 transition-all" bind:value={searchValue}/>

        <!--List-->
        <div class="relative w-[90%] my-5 flex-1 flex flex-col overflow-y-auto">
            {#if searchValue}
            .
            {:else}
                {#if chats.size == 0}
                <p class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 pointer-events-none">No chats found {":("}</p> <!--to fix highliting error-->
                {:else}
                {#each getSortedChatList(chats) as c}
                <div>

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