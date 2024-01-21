<script lang="ts">
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { SearchResult } from "$lib/chat/types";
    import ChatList from "$lib/components/chat/chat-list.svelte";
    import UserAvatar from "$lib/components/user-avatar.svelte";
    import Search from "$lib/components/utils/search.svelte";
    import { cubicInOut } from "svelte/easing";
    import { fade } from "svelte/transition";

    export let attachmentHandler: SocketAttachmentHandler;
    export let searchHandler: (val: string) => Promise<SearchResult>;
    export let changeAllowSubmit: (val: boolean) => void;

    export let chatMembers: string[];

    $: changeAllowSubmit(chatMembers.length < 2);

    let scrollContainer: HTMLElement;

    let searchValue: string;
    let searchResults: SearchResult|undefined;

    function onScroll(ev: WheelEvent) {
        ev.preventDefault();
        scrollContainer.scrollLeft += ev.deltaY;
    }

    function onSearchItemClick(ev: CustomEvent) {
        const target = ev.detail as string;

        chatMembers.push(target);
        chatMembers = chatMembers;
        searchValue = '';
    }
</script>

<svelte:options accessors={true} />

<div class="w-96 flex flex-col gap-2">
    <Search {searchHandler} bind:ignoreList={chatMembers} bind:searchResults bind:searchValue>
        {#if searchResults}
        <div class="absolute top-[110%] left-0 w-full p-4 bg-white z-20" transition:fade={{duration: 100, easing: cubicInOut }}>
            <ChatList items={searchResults} {attachmentHandler} on:onItemClick={onSearchItemClick}/>
        </div>
        {/if}
    </Search>
    
    <div class="w-full flex gap-2 overflow-x-auto" bind:this={scrollContainer} on:wheel={onScroll}>
        <button disabled class="user-button opacity-50">
            <UserAvatar size={24} urlPromise={attachmentHandler.getUserAvatar(chatMembers[0])} />
            {chatMembers[0]}
        </button>

        {#each chatMembers.slice(1) as m}
        <button class="user-button">
            <UserAvatar size={24} urlPromise={attachmentHandler.getUserAvatar(m)} />
            {m}
            <img src="icons/delete.svg" alt="delete user from group chat" />
        </button>
        {/each}
    </div>
</div>

<style lang="postcss">
    .user-button {
        @apply px-3 py-2 border-2 rounded-full flex items-center gap-1;
    }
</style>