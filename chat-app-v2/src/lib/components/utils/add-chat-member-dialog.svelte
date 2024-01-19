<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { SearchResult } from "$lib/chat/types";
    import { cubicInOut } from "svelte/easing";
    import { fade } from "svelte/transition";
    import ChatList from "../chat/chat-list.svelte";
    import Dialog from "./dialog.svelte";
    import Search from "./search.svelte";
    import { createEventDispatcher } from "svelte";

    export let attachmentHandler: SocketAttachmentHandler;
    export let searchHandler: (val: string) => Promise<SearchResult>;

    const dispatch = createEventDispatcher();

    let dialog: Dialog;
    let searchValue: string;
    let searchResults: SearchResult|undefined;

    export function showDialog() {
        searchValue = '';
        dialog.showDialog();
    } 
</script>

<Dialog title="Add chat member" bind:this={dialog}>
    <Search {searchHandler} bind:searchResults bind:searchValue>
        {#if searchResults}
        <div class="absolute top-[110%] left-0 w-full p-4 bg-white z-20" transition:fade={{duration: 100, easing: cubicInOut }}>
            <ChatList items={searchResults} {attachmentHandler} on:onItemClick={e => { dialog.closeDialog(); dispatch('onItemClick', e.detail) }} />
        </div>
        {/if}
    </Search>
</Dialog>