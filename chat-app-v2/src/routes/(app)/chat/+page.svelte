<script lang="ts">
    import { SocketWrapper } from "$lib/chat/socket-wrapper";
    import { afterUpdate, onDestroy, onMount } from "svelte";
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
    import Search from "$lib/components/utils/search.svelte";
    import EditableChatCover from "$lib/components/utils/editable-chat-cover.svelte";
    import EditableText from "$lib/components/utils/editable-text.svelte";
    import ListDropdown from "$lib/components/ui/list-dropdown.svelte";
    import { showEditValueDialog } from "$lib/components/dialog/controllers/show-edit-value-dialog";
    import { mountedDialog } from "$lib/stores/mountedDialog";
    import { showCreateGroupChatDialog } from "$lib/components/dialog/controllers/show-create-group-chat-dialog";
    import { showConfirmDialog } from "$lib/components/dialog/controllers/show-confirm-dialog";
    import { showAddChatMemberDialog } from "$lib/components/dialog/controllers/show-add-chat-member-dialog";
    import IconTextButton from "$lib/components/ui/icon-text-button.svelte";
    import IconButton from "$lib/components/ui/icon-button.svelte";
    import IconGradientButton from "$lib/components/ui/icon-gradient-button.svelte";
    import ChatMemberList from "$lib/components/chat/chat-member-list.svelte";

    export let data: PageData;

    const socketUsername = data.session!.user.username;

    let chatTrees = new Map<number, ChatTree>();
    let chatList = new ChatListWrapper();
    let currentChat: ChatView|null = null;

    let isTabFocused = false;

    let includedAttachments: File[] = [];
    let draftMessageValue = '';

    let chatWindow: HTMLElement;
    let savedScrollTop = 0;
    let pendingMessageRequest = false;

    let chatSearchValue: string;
    let chatSearchResults: SearchResult;

    let showChatOptions = true;

    $: dialog = $mountedDialog;

    /*
    TODO:
    Loading chats on scrolling the left panel
    REFACTOR
    message reactions
    message deletion
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

        chatCreated(chatData, systemMessage) {
            const chat = new ChatTree(socketUsername, chatData);
            if (systemMessage) chat.pushMessage(systemMessage);

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

    onMount(() => {
        dialog = $mountedDialog;
    })

    onDestroy(() => {
        socket.dispose();
    });

    afterUpdate(() => {
        if (chatWindow) {
            chatWindow.scrollTop = savedScrollTop;
            chatWindow = chatWindow;
        }
    })

    async function getChat(target: number|string) {        
        if (typeof target === "string") {
            const chat = chatList.array.find(c => c.private && c.otherMember.username == target);
            if (chat) return chat;
        } else if (chatTrees.has(target)) return chatTrees.get(target)!;
        
        const chatData = await socket.getChatData(target);
        if (!chatData) return null;

        const chat = new ChatTree(socketUsername, chatData);
        chatTrees.set(chatData.chat.id, chat);

        return chat;
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

    function playNotificationSound() {
        if (!isTabFocused) new Audio("audio/notification.mp3").play();
    }

    async function openChat(ev: CustomEvent) {    
        const target = ev.detail;
        
        if (currentChat && currentChat.id === target) return;

        if (typeof target === "string") {
            const chat = await getChat(target);
             
            currentChat = chat??new TempChat(target, data.session!.user.username); 
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

    async function onChatScroll() {
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

    function editChatName() {
        showEditValueDialog(dialog, "Edit chat name", currentChat!.displayName, "Chat name", v => {
            socket.setChatName(currentChat!.id as number, v); // ? you can only edit group chat's name, which always has it's id type as number
        });
    }

    function editNickname(member: ChatMember) {
        showEditValueDialog(dialog, "Edit nickname", member.nickname??'', member.username, async (v) => {
            const chat = await ensureCurrentChatExists();
            if (!chat) return;

            socket.setChatNickname(chat.id, member.username, v);
        })
    }

    function createGroupChat() {
        const lockedMember = currentChat instanceof ChatTree? currentChat.otherMember.username : currentChat!.id as string;

        showCreateGroupChatDialog(dialog, socket.attachmentHandler, (val: string) => socket.search(val, false), lockedMember, (members: string[]) => {
            socket.createChat(members);
        });
    }

    function deleteChat() {
        if (typeof currentChat!.id === "string") currentChat = null;
        else {
            showConfirmDialog(dialog, "Delete chat?", () => socket.deleteChat(currentChat!.id as number));
        }
    }

    function addChatMember() {
        showAddChatMemberDialog(dialog, socket.attachmentHandler, currentChat!.members.map(m => m.username), (val: string) => socket.search(val, false), (member: string) => {
            socket.addChatMember(currentChat!.id as number, member);
        })
    }

    function removeChatMember(member: string) {
        showConfirmDialog(dialog, "Remove member?", () => socket.removeChatMember(currentChat!.id as number, member));
    }

    function leaveGroupChat() {
        showConfirmDialog(dialog, "Leave group chat?", () => socket.leaveGroupChat(currentChat!.id as number));
    }

    function changeChatMemberRank(member: string) {
        socket.changeChatMemberRank(currentChat!.id as number, member);
    }

    async function ensureCurrentChatExists() {
        if (!currentChat) return null;
        
        if (typeof currentChat.id === "number") return currentChat as ChatTree;
        else {
            const chat = await getChat(currentChat.id);
            if (!chat) return null;

            chatList.insertOrPushToFront(chat);

            return chat;
        }
    }
</script>

<svelte:window on:focus={() => isTabFocused = true} on:blur={() => isTabFocused = false} />

<div class="absolute w-full h-full flex">
    <div id="chat-list" class="relative flex-shrink-0 w-96 mt-14 flex flex-col shadow-lg overflow-y-auto p-4">
        <div class="w-full">
            <Search label="Chats" searchHandler={(val) => socket.search(val, true)} bind:searchValue={chatSearchValue} bind:searchResults={chatSearchResults} />
        </div>

        <div class="relative pt-8 flex-1">
            {#if !chatSearchValue && chatList.empty}
            <h1 class="center-text-placeholder">Future chats will be displayed here</h1>
            {:else}
                {#if chatSearchValue}
                    {#if chatSearchResults}
                    <ChatList items={chatSearchResults} attachmentHandler={socket.attachmentHandler} on:onItemClick={openChat}/>
                    {/if}
                {:else}
                <ChatList items={chatList.array} attachmentHandler={socket.attachmentHandler} on:onItemClick={openChat}/>
                {/if}
            {/if}
        </div>
    </div>

    <div class="relative flex-grow mt-14 flex flex-col p-4">
        {#if currentChat}
        <div class="w-full h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <UserAvatar size={44} urlPromise={getChatCover(currentChat.chatCover, socket.attachmentHandler)} />
                <h1 class="text-xl">{currentChat.displayName}</h1>
            </div>

            <IconButton src="icons/more.svg" alt="Switch chat options visibility" on:click={() => showChatOptions = !showChatOptions} />
        </div>

        <div class="min-w-0 flex-grow flex flex-col-reverse gap-2 overflow-y-auto pr-1 overscroll-y-none" role="feed" bind:this={chatWindow} on:scroll={onChatScroll} on:dragover|preventDefault on:drop={onDrop}>            
            {#each currentChat.messageGroups as group (group.id)}
            <MessageGroup {group} attachmentHandler={socket.attachmentHandler} {socketUsername} on:deleteMessage />
            {/each}
        </div>

        <div class="w-full">
            <AttachmentList bind:attachments={includedAttachments} />

            <div class="w-full h-16 flex gap-2 items-center">
                <input type="text" placeholder="Write a message" class="flex-1 px-4 py-2 border-2 focus:outline-none rounded-full" bind:value={draftMessageValue} on:keydown={e => {
                    if (e.key == "Enter") sendMessage();
                }} />
    
                <IconGradientButton src="icons/send.svg" alt="Send message" on:click={sendMessage} />
            </div>
        </div>
        {:else}
        <h1 class="center-text-placeholder">No chat opened</h1>
        {/if}
    </div>

    {#if showChatOptions && currentChat}
    <div class="w-80 mt-24 p-4 shadow-lg flex flex-col gap-2">
        <div class="flex flex-col items-center gap-2 w-full p-4">            
            {#if currentChat.private}
            <UserAvatar size={80} urlPromise={getChatCover(currentChat.chatCover, socket.attachmentHandler)} />
            <h1 class="hide-text-overflow">{currentChat.displayName}</h1>
            {:else}
            <EditableChatCover size={80} urlPromise={getChatCover(currentChat.chatCover, socket.attachmentHandler)} on:click={() => {}} />
            
            <EditableText value={currentChat.displayName} on:click={editChatName} />
            {/if}
        </div>

        {#if currentChat.private}
        <IconTextButton text="Create group chat" src="icons/group-add.svg" on:click={createGroupChat} />
        <IconTextButton text="Delete chat" src="icons/delete.svg" on:click={deleteChat} />
        {:else}
        <IconTextButton text="Add chat member" src="icons/group-add.svg" on:click={addChatMember} />
        {/if}

        <ListDropdown name="Chat members">
            <ChatMemberList attachmentHandler={socket.attachmentHandler} chat={currentChat} {socketUsername}
                on:changeRank={e => changeChatMemberRank(e.detail)}
                on:removeMember={e => removeChatMember(e.detail)}
                on:leaveChat={leaveGroupChat}
                on:message={openChat}
            />
        </ListDropdown>

        <ListDropdown name="Nicknames">
            {#each currentChat.members as m (m.username)}
            <IconTextButton text={m.nickname??m.username} on:click={() => editNickname(m)}>
                <UserAvatar urlPromise={getChatCover(m.username, socket.attachmentHandler)} size={28} />
            </IconTextButton>
            {/each}
        </ListDropdown>
    </div>
    {/if}
</div>