<script lang="ts">
    import UserAvatar from "$lib/components/user-avatar.svelte";
    import Dialog from "$lib/components/utils/dialog.svelte";
    import { onMount } from "svelte";

    export let urlPromise: Promise<string|null>;
    export let size: number;

    let mounted = false;
    onMount(() => mounted = true);
</script>

<div class="relative rounded-full overflow-hidden aspect-square" style="height: {size}px;">
    <button class="peer" on:click>
        {#if mounted}
        <UserAvatar {urlPromise} {size} />
        {:else}
        <div class="aspect-square" style="height: {size}px"/>
        {/if}
    </button>

    <div class="absolute top-0 left-0 pointer-events-none w-full h-full bg-black bg-opacity-30 z-10 opacity-0 peer-hover:opacity-100 transition-all">
        <img src="icons/edit-white.svg" alt="edit" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="height: {size / 2}px"/>
    </div>
</div>