<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { Message } from "$lib/chat/types";
    import Attachment from "./attachment.svelte";

    export let message: Message;
    export let attachmentHandler: SocketAttachmentHandler;
    export let isSocketOwned: boolean;
</script>

{#if message.is_attachment == 1}
<Attachment urlPromise={attachmentHandler.getAttachment(Number(message.content))} />
{:else}
<h1 class="w-fit px-4 py-2 break-words max-w-[80%] text-white {isSocketOwned? 
        'main-gradient rounded-l-3xl rounded-r-lg first:rounded-tr-3xl last:rounded-br-3xl' 
    :   'bg-gray-500 rounded-r-3xl rounded-l-lg first:rounded-tl-3xl last:rounded-bl-3xl'}
">{message.content}</h1>
{/if}