<script lang="ts">
    import type { MessageGroup } from "$lib/chat/message-group";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import UserAvatar from "$lib/components/user-avatar.svelte";
    import ChatMessage from "./messages/chat-message.svelte";

    export let group: MessageGroup;
    export let attachmentHandler: SocketAttachmentHandler;

    const socketIsOwner = group.username == group.tree.socketUsername;
    let groupOwnerNickname = group.tree.members.find(m => m.username == group.username)?.nickname;
</script>


{#if !group.username}
<div class="w-full flex flex-col gap-1">
    {#each group.messages as m (m.id)}
    <h1 class="w-full text-center text-gray-300">{m.content}</h1>
    {/each}
</div>
{:else if socketIsOwner}
<div class="w-full flex flex-col items-end">
    {#each group.messages as m (m.id)}
    <ChatMessage isSocketOwned={true} message={m} {attachmentHandler} />
    {/each}
</div>
{:else}
<div class="w-full flex">
    <div class="h-full flex align-bottom justify-center">
        <UserAvatar size={32} urlPromise={attachmentHandler.getUserAvatar(group.username)} />
    </div>

    <div class="flex-1 flex flex-col gap-1">
        <small class="w-fit text-gray-400">{groupOwnerNickname??group.username}</small>

        {#each group.messages as m (m.id)}
        <ChatMessage isSocketOwned={false} message={m} {attachmentHandler} />
        {/each}
    </div>
</div>
{/if}