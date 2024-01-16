<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { fade, scale } from "svelte/transition";

    export let title: string;
    let show: boolean;

    export function showDialog() { show = true; }
    export function closeDialog() { show = false; }

    function closeOnBackdropClick(e: Event) {
        if (e.target instanceof HTMLElement && e.target.id === "backdrop") {
            show = false;
        }
    }
</script>

<svelte:window on:mousedown={closeOnBackdropClick}/>

{#if show}
<div id="backdrop" class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 z-20" transition:fade={{duration: 100, easing: cubicInOut}}>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 min-w-64 min-h-32 bg-white rounded-3xl flex flex-col items-center justify-between gap-2 shadow-lg" on:submit={closeDialog} transition:scale={{duration: 100, easing: cubicInOut}}>
        <h1 class="text-2xl">{title}</h1>

        <slot/>

        <button class="opacity-50" on:click={() => show = false}>Cancel</button>
    </div>
</div>
{/if}