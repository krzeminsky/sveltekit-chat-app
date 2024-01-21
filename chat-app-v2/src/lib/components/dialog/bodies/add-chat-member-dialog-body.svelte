<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { SearchResult } from "$lib/chat/types";
    import ChatList from "$lib/components/chat/chat-list.svelte";
    import Search from "$lib/components/utils/search.svelte";
    import { cubicInOut } from "svelte/easing";
    import { fade } from "svelte/transition";

    export let attachmentHandler: SocketAttachmentHandler;
    export let searchHandler: (val: string) => Promise<SearchResult>;
    export let ignoreList: string[];

    export let selected: string = '';

    let searchValue: string;
    let searchResults: SearchResult|undefined;

    let formElement: HTMLFormElement;
</script>

<svelte:options accessors={true} />

<form bind:this={formElement}>
    <Search {searchHandler} {ignoreList} bind:searchResults bind:searchValue>
        {#if searchResults}
        <div class="absolute top-[110%] left-0 w-full p-4 bg-white z-20" transition:fade={{duration: 100, easing: cubicInOut }}>
            <ChatList items={searchResults} {attachmentHandler} on:onItemClick={e => { selected = e.detail; formElement.requestSubmit()  }} />
        </div>
        {/if}
    </Search>
</form>