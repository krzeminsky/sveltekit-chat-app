<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { Message } from "$lib/chat/types";
    import { createEventDispatcher } from "svelte";
    import Attachment from "./attachment.svelte";

    export let message: Message;
    export let attachmentHandler: SocketAttachmentHandler;
    export let isSocketOwned: boolean;

    const dispatch = createEventDispatcher();
</script>

<div class="group w-full flex gap-1 items-center {isSocketOwned? 'flex-row-reverse' : ''}">
    {#if message.is_attachment == 1}
    <Attachment urlPromise={attachmentHandler.getAttachment(Number(message.content))} />
    {:else}
    <h1 class="w-fit px-4 py-2 break-words max-w-[80%] text-white {isSocketOwned? 
            'right main-gradient rounded-l-3xl rounded-r-lg' 
        :   'left bg-gray-500 rounded-r-3xl rounded-l-lg'}
    ">{message.content}</h1>
    {/if}

    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {#if isSocketOwned}
        <button on:click={() => dispatch('deleteMessage', message.id)}>
            <img src="icons/delete.svg" alt="delete message" />
        </button>
        {/if}

        <button>
            <img src="icons/add-reaction.svg" alt="add reaction" />
        </button>
    </div>
</div>