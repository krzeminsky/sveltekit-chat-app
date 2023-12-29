<script lang="ts">
    import { reactionMap } from "$lib/chat/reactions";
    import { createEventDispatcher } from "svelte";

    export let selectedReaction: number|null = null;

    let show = false;
    const dispatch = createEventDispatcher();

    $: dispatch('stateChanged', show);

    function addReaction(id: number) {
        show = false;
        dispatch('addReaction', id == selectedReaction? null : id);
    }

    function closeReactionDialog(e: Event) {
        if (e.target instanceof HTMLElement && !e.target.hasAttribute('data-dialog')) {
            show = false;
        }
    }
</script>

<svelte:window on:mousedown={closeReactionDialog} />

<div class="relative">
    <button data-dialog on:click={() => show = !show}>
        <img data-dialog src="add-reaction" alt="add reaction"/>
    </button>

    {#if show}
    <div data-dialog class="px-5 py-2 flex gap-1">
        {#each reactionMap as r, i}
        <button data-dialog class="rounded-lg p-2 {i == selectedReaction? 'bg-gray-300' : 'bg-white'} hover:bg-gray-400 transition-all" on:click={() => addReaction(i)}>
            {r}
        </button>
        {/each}
    </div>
    {/if}
</div>
