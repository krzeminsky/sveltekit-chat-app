<script lang="ts">
    import type { ChatView } from "$lib/chat/chat-view";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { Chat, ChatData, ChatMember } from "$lib/chat/types";
    import { getChatCover } from "$lib/utils/get-chat-cover";
    import { fade } from "svelte/transition";
    import UserAvatar from "../user-avatar.svelte";
    import ListDropdown from "../utils/list-dropdown.svelte";
    import { cubicInOut } from "svelte/easing";
    import { createEventDispatcher } from "svelte";

    export let chat: ChatView;
    export let attachmentHandler: SocketAttachmentHandler;
    export let socketUsername: string;

    const dispatch = createEventDispatcher();

    $: socketAsMember = chat.members.find(m => m.username == socketUsername)!;

    let activeMenu = -1;

    function closeOnOutsideClick(e: Event) {
        if (e.target instanceof HTMLElement && e.target.parentNode instanceof HTMLElement && !e.target.parentNode.hasAttribute('data-block')) activeMenu = -1;
    }
</script>

<svelte:window on:mousedown={closeOnOutsideClick}/>

<ListDropdown name="Chat members">
    {#each chat.members as m, i}
    <div class="relative">
        <button class="fill-gray-button" on:click={() => activeMenu = i}>
            <UserAvatar urlPromise={getChatCover(m.username, attachmentHandler)} size={28} />
            <span class="ml-1 align-middle">{m.username}</span>
        </button>

        {#if activeMenu == i}
        <div class="absolute top-0 right-full flex flex-col gap-2 p-2 bg-white shadow-lg rounded-lg" data-block transition:fade={{duration: 100, easing: cubicInOut}}>
            {#if m == socketAsMember}
                {#if !chat.private}
                <button class="fill-gray-button" on:click={() => dispatch('leaveChat')}>Leave chat</button>
                {/if}
            {:else}
            
            {#if !chat.private}
            <button class="fill-gray-button" on:click={() => dispatch('message', m.username)}>Message</button>
            {/if}

            {#if socketAsMember.rank > m.rank}
            <button class="fill-gray-button" on:click={() => dispatch('changeRank', m.username)}>{m.rank == 1? 'Remove admin' : 'Add admin'}</button>
            {/if}

            {#if m.rank < socketAsMember.rank}
            <button class="fill-gray-button" on:click={() => dispatch('removeMember', m.username)}>Remove member</button>
            {/if}

            <button class="fill-gray-button" on:click={() => dispatch('blockMember', m.username)}>Block</button>

            {/if}

        </div>
        {/if}
    </div>
    {/each}
</ListDropdown>