<script lang="ts">
    import type { ChatView } from "$lib/chat/chat-view";
    import { createEventDispatcher } from "svelte";
    import ChatMessageGroup from "../chat/chat-message-group.svelte";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";

    export let attachmentHandler: SocketAttachmentHandler;
    export let view: ChatView;

    const dispatch = createEventDispatcher();
    const SPLIT_THRESHOLD = 1000 * 60 * 30; // ? 30 minutes

    $: messageGroups = view.messageGroups;

    function getTimestamp(i: number) {
        if (i == 0) return messageGroups[i].firstTimestamp;
        else if (messageGroups[i].firstTimestamp - messageGroups[i - 1].firstTimestamp > SPLIT_THRESHOLD) return messageGroups[i].firstTimestamp;

        return null;
    }
</script>

<div class="min-w-0 flex-grow flex flex-col-reverse gap-2 overflow-y-auto pr-1 overscroll-y-none">
    {#each messageGroups as group, i (group.id)}

    <ChatMessageGroup {group} {attachmentHandler} />

    {@const timestamp = getTimestamp(i)}
    {#if timestamp}
    <h1 class="w-full text-center text-gray-400">{new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</h1>
    {/if}
    {/each}
</div>