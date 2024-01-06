<script lang="ts">
    import { ChatTree } from "$lib/chat/chat-view";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { SearchResult } from "$lib/chat/types";
    import { createEventDispatcher } from "svelte";
    import ChatListItem from "./chat-list-item.svelte";
    import { getChatCover } from "$lib/utils/get-chat-cover";

    export let items: SearchResult|ChatTree[];
    export let attachmentHandler: SocketAttachmentHandler;

    const dispatch = createEventDispatcher();

    function getCover(coverId: number|null|string) {
        return getChatCover(coverId, attachmentHandler);
    }

    function onItemClick(target: string|number) {
        dispatch("onItemClick", target);
    }
</script>

<div class="w-full h-full overflow-y-auto flex flex-col gap-2">
    {#if 'users' in items}
        {#each items.users as u}
        <ChatListItem name={u} coverUrlPromise={getCover(u)} on:click={() => onItemClick(u)} />
        {/each}

        {#if items.chats}
        {#each items.chats as c}
        <ChatListItem name={c.name} coverUrlPromise={getCover(c.cover_id)} on:click={() => onItemClick(c.id)} />
        {/each}
        {/if}
    {:else}
        {#each items as c}
        <ChatListItem name={c.displayName} coverUrlPromise={getCover(c.chatCover)} on:click={() => onItemClick(c.id)}>
            <div class="flex text-sm text-gray-400">
                <h2 class="flex-1 hide-text-overflow">{c.lastMessagePreview}</h2>
                <h2 class="ml-2">{c.lastMessageTime}</h2>
            </div>
        </ChatListItem>
        {/each}
    {/if}
</div>