<script lang="ts">
    import Dialog from "./dialog.svelte";   
    import SubmitButton from "../form/submit-button.svelte";
    import UserAvatar from "../user-avatar.svelte";
    import Search from "./search.svelte";
    import ChatList from "$lib/components/chat/chat-list.svelte";
    import { type ChatView, ChatTree } from "$lib/chat/chat-view";
    import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
    import type { SearchResult } from "$lib/chat/types";
    import { fade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";

    export let attachmentHandler: SocketAttachmentHandler;
    export let searchHandler: (val: string) => Promise<SearchResult>;
    export let createGroupChat: (members: string[]) => void;

    let chatMembers: string[];

    let dialog: Dialog;
    let scrollContainer: HTMLElement;

    let searchValue: string;
    let searchResults: SearchResult|undefined;

    $: if (searchResults) {
        for (let i = 0; i < searchResults.users.length; i++) {
            if (chatMembers.includes(searchResults.users[i])) searchResults.users.splice(i, 1);
        }
    }

    export function showDialog(chatView: ChatView) {
        if (chatView instanceof ChatTree) {
            chatMembers = [chatView.otherMember.username];
        } else {
            chatMembers = [chatView.id as string];
        }

        dialog.showDialog();
    }

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

<Dialog title="Create group chat" bind:this={dialog}>
    <form class="w-96 flex flex-col gap-2" on:submit={() => createGroupChat(chatMembers)}> 
        <Search {searchHandler} bind:searchResults bind:searchValue>
            {#if searchResults}
            <div class="absolute top-[110%] left-0 w-full p-4 bg-white z-20" transition:fade={{duration: 100, easing: cubicInOut }}>
                <ChatList items={searchResults} {attachmentHandler} on:onItemClick={onSearchItemClick}/>
            </div>
            {/if}
        </Search>
        
        <div class="w-full flex gap-2 overflow-x-auto" bind:this={scrollContainer} on:wheel={onScroll}>
            <button disabled class="user-button opacity-50" type="button">
                <UserAvatar size={24} urlPromise={attachmentHandler.getUserAvatar(chatMembers[0])} />
                {chatMembers[0]}
            </button>

            {#each chatMembers.slice(1) as m}
            <button class="user-button" type="button">
                <UserAvatar size={24} urlPromise={attachmentHandler.getUserAvatar(m)} />
                {m}
                <img src="icons/delete.svg" alt="delete user from group chat" />
            </button>
            {/each}
        </div>

        <SubmitButton disabled={chatMembers.length == 1}/>
    </form>
</Dialog>

<style lang="postcss">
    .user-button {
        @apply px-3 py-2 border-2 rounded-full flex items-center gap-1;
    }
</style>