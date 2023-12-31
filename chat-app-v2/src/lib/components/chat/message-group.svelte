<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { MessageGroup } from "$lib/chat/message-group";
    import { createEventDispatcher } from "svelte";
    import UserAvatar from "../user-avatar.svelte";
    import Attachment from "./attachment.svelte";
    import MessageBox from "./message-box.svelte";
    import ReactionButton from "./reaction-button.svelte";
    import { getUsersReaction } from "$lib/chat/reactions";
    import ConfirmDialog from "../utils/confirm-dialog.svelte";

    export let group: MessageGroup;
    export let attachmentHandler: SocketAttachmentHandler;
    export let socketUsername: string;

    const left = socketUsername == group.username;
    const dispatch = createEventDispatcher();

    let reactionDialogOpen = false;
    let deleteMessageDialog: ConfirmDialog;

    function deleteMessage(id: number) {
        dispatch('deleteMessage', id);
    }

    function setActiveReactionDialog(e: any) {
        reactionDialogOpen = e as boolean;
    }
</script>

<div class="flex {left? 'flex-row-reverse' : ''}">
    {#if left}
    <div class="h-full w-8 flex align-bottom justify-center">
        <UserAvatar size={24} urlPromise={attachmentHandler.getUserAvatar(group.username)}/>
    </div>
    {/if}

    {#each group.messages as m}
    <div class="group">
        {#if m.is_attachment == 1}
        <Attachment urlPromise={attachmentHandler.getAttachment(Number(m.content))} />
        {:else}
        <MessageBox {left} content={m.content} reactions={m.reactions} />
        {/if}

        <div class="hidden gap-1 {reactionDialogOpen? 'flex' : 'group-hover:flex'}">
            <ReactionButton selectedReaction={getUsersReaction(socketUsername, m.reactions)} on:stateChanged={setActiveReactionDialog} on:addReaction />

            {#if !left}
            <button on:click={() => deleteMessageDialog.showDialog(() => deleteMessage(m.id))}>
                <img src="delete.svg" alt="delete message" />
            </button>
            {/if}
        </div>
    </div>
    {/each}
</div>

<ConfirmDialog title="Delete message?" bind:this={deleteMessageDialog}/>