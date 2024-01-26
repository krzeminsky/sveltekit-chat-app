<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { ChatMember } from "$lib/chat/types";
    import IconTextButton from "../ui/icon-text-button.svelte";
    import { getChatCover } from "$lib/utils/get-chat-cover";
    import Cover from "$lib/components/cover.svelte";
    import { fade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
    import type { ChatView } from "$lib/chat/chat-view";
    import { createEventDispatcher } from "svelte";

    export let attachmentHandler: SocketAttachmentHandler;
    export let socketUsername: string;
    export let chat: ChatView;

    const dispatch = createEventDispatcher();

    let socketAsMember: ChatMember;
    let selectedMember: ChatMember|null = null;

    $: if (chat) {
        socketAsMember = chat.members.find(m => m.username == socketUsername)!;
        selectedMember = null;
    }

    function leaveChat() { sendEvent('leaveChat') }
    function message() { sendEvent('message') }
    function changeRank() { sendEvent('changeRank') }
    function removeMember() { sendEvent('removeMember') }

    function sendEvent(ev: string) {
        dispatch(ev, selectedMember!.username);
        selectedMember = null;
    }
</script>

<svelte:window on:click={() => selectedMember = null}/>

{#each chat.members as m (m.username)}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="relative" on:click|stopPropagation>
    <IconTextButton text={m.username} on:click={() => {
        if (selectedMember !== m) selectedMember = m
        else selectedMember = null
    }}>
        <Cover urlPromise={getChatCover(m.username, attachmentHandler)} size={28} />
    </IconTextButton>

    {#if selectedMember === m}
    <div id="member-actions" class="absolute top-0 right-full flex flex-col gap-2 p-2 bg-white shadow-lg rounded-lg" transition:fade={{duration: 100, easing: cubicInOut}}>
        {#if m.username == socketUsername}
            {#if !chat.private}
            <IconTextButton text="Leave chat" src="icons/leave.svg" on:click={leaveChat} />
            {/if}
        {:else}
        
        {#if !chat.private}
        <IconTextButton text="Message" src="icons/message.svg" on:click={message}/>
        {/if}

        {#if socketAsMember.rank > m.rank}
        <IconTextButton text={m.rank == 1? 'Demote' : 'Promote to admin'} src="icons/build.svg" on:click={changeRank}/>
        <IconTextButton text="Remove member" src="icons/delete.svg" on:click={removeMember} />
        {/if}

        <IconTextButton text="Block" src="icons/block.svg" on:click />

        {/if}
    </div>
    {/if}
</div>
{/each}