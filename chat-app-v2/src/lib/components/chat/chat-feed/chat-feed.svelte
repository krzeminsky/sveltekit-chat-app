<script lang="ts">
    import type { ChatView, ChatTree } from "$lib/chat/chat-view";
    import { createEventDispatcher } from "svelte";
    import ChatMessageGroup from "./chat-message-group.svelte";
    import { formatRelativeDate } from "$lib/utils/format-relative-date";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";

    export let attachmentHandler: SocketAttachmentHandler;
    export let view: ChatView;

    const dispatch = createEventDispatcher();
    const SPLIT_THRESHOLD = 1000 * 60 * 30; // ? 30 minutes

    let chatFeedContainer: HTMLElement;
    let savedScrollTop = 0;
    let pendingHistoryRequest = false;

    $: messageGroups = view.messageGroups;

    function getTimestamp(i: number) {
        if (i == messageGroups.length - 1) return messageGroups[i].firstTimestamp;
        else if (messageGroups[i].firstTimestamp - messageGroups[i + 1].firstTimestamp > SPLIT_THRESHOLD) return messageGroups[i].firstTimestamp;
    
        return null;
    }

    async function onScroll() { 
        // ? weird glitch, where the scrollbar would go outside of it's scroll range
        if (chatFeedContainer.scrollTop == 1) {
            chatFeedContainer.scrollTop = 0;
        }

        if (pendingHistoryRequest) {
            if (chatFeedContainer.scrollTop < savedScrollTop) {
                chatFeedContainer.scrollTop = savedScrollTop;
                chatFeedContainer = chatFeedContainer;
            }
            
            return;
        }

        if ((chatFeedContainer.scrollTop * -1 + chatFeedContainer.clientHeight) >= chatFeedContainer.scrollHeight - 1) {
            const chat = view as ChatTree;
            if (chat.hasFullHistory) return;

            pendingHistoryRequest = true;

            dispatch('historyRequest', () => {
                setTimeout(() => pendingHistoryRequest = false, 200);
            });
        }

        savedScrollTop = chatFeedContainer.scrollTop;
    }

    function onDrop(e: DragEvent) {
        e.preventDefault();

        if (e.dataTransfer) {
            let attachments: File[] = [];

            [...e.dataTransfer.items].forEach(i => {
                if (i.kind == "file") {
                    const file = i.getAsFile()!;
                    attachments.push(file);
                }
            }) 

            dispatch('drop', attachments);
        }
    }
</script>

<div role="feed" class="w-full min-w-0 flex flex-col-reverse gap-2 overflow-y-auto pr-1 overflow-x-hidden" bind:this={chatFeedContainer} on:scroll={onScroll} on:drop={onDrop} on:dragover|preventDefault>
    {#each messageGroups as group, i (group.id)}

    <ChatMessageGroup {group} {attachmentHandler} on:deleteMessage />

    {@const timestamp = getTimestamp(i)}
    {#if timestamp}
    <h1 class="w-full text-center text-gray-400">{formatRelativeDate(timestamp)}</h1>
    {/if}
    {/each}
</div>