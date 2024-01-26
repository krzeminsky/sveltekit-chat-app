<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { MessageGroup } from "$lib/chat/message-group";
    import { createEventDispatcher, onMount } from "svelte";
    import Cover from "../cover.svelte";
    import Attachment from "./attachment.svelte";
    import MessageBox from "./message-box.svelte";

    export let group: MessageGroup;
    export let attachmentHandler: SocketAttachmentHandler;
    export let socketUsername: string;

    const left = group.username != "" && socketUsername != group.username;
    const dispatch = createEventDispatcher();

    let reactionDialogOpen = false;
</script>

<div class="flex gap-2">
    {#if left}
    <div class="relative h-full w-8">
        <div class="absolute bottom-1 left-1/2 -translate-x-1/2">
            <Cover size={32} urlPromise={attachmentHandler.getUserAvatar(group.username)}/>
        </div>
    </div>
    {/if}

    <div class="w-full">
        <h1 class="text-gray-500 text-sm mb-0.5 {!left? 'text-right' : ''}">{group.tree.members.find(m => m.username == group.username)?.nickname??group.username}</h1>

        <div class="w-full group flex flex-col gap-0.5 {!left? 'items-end' : ''}">
            {#each group.messages as m}
        
                {#if m.is_attachment == 1}
                <Attachment urlPromise={attachmentHandler.getAttachment(Number(m.content))} />
                {:else if !m.username}
                <h1 class="text-center text-gray-400 w-full">{m.content}</h1>
                {:else}
                <MessageBox {left} content={m.content} reactions={m.reactions} />
                {/if}
            {/each}
        </div>
    </div>
</div>