<script lang="ts">
    import type { MessageGroup } from "$lib/chat/message-group";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import Cover from "$lib/components/cover.svelte";
    import ChatMessage from "./messages/chat-message.svelte";

    export let group: MessageGroup;
    export let attachmentHandler: SocketAttachmentHandler;

    const socketIsOwner = group.username == group.tree.socketUsername;
    let groupOwnerNickname = group.tree.members.find(m => m.username == group.username)?.nickname;
</script>


{#if !group.username}
<div class="w-full flex flex-col gap-0.5">
    {#each group.messages as m (m.id)}
    <h1 class="w-full text-center text-gray-300">{m.content}</h1>
    {/each}
</div>
{:else if socketIsOwner}
<div class="message-group w-full flex flex-col gap-0.5 items-end">
    {#each group.messages as m (m.id)}
    <ChatMessage isSocketOwned={true} message={m} {attachmentHandler} on:deleteMessage />
    {/each}
</div>
{:else}
<div class="w-full min-w-0 flex gap-1">
    <div class="h-full flex items-end justify-center pb-1">
        <Cover size={32} urlPromise={attachmentHandler.getUserAvatar(group.username)} />
    </div>

    <div class="min-w-0 flex-1 flex flex-col gap-0.5">
        <small class="w-fit text-gray-400">{groupOwnerNickname??group.username}</small>

        <div class="message-group min-w-0 w-full flex flex-col gap-0.5">
            {#each group.messages as m (m.id)}
            <ChatMessage isSocketOwned={false} message={m} {attachmentHandler} on:deleteMessage />
            {/each}
        </div>
    </div>
</div>
{/if}

<style lang="postcss">
    :global(.message-group div:last-child .left) {
        @apply rounded-bl-3xl;
    }

    :global(.message-group div:last-child .right) {
        @apply rounded-br-3xl;
    }

    :global(.message-group div:first-child .left) {
        @apply rounded-tl-3xl;
    }

    :global(.message-group div:first-child .right) {
        @apply rounded-tr-3xl;
    }
</style>