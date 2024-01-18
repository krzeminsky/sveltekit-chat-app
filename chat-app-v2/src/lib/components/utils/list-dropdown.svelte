<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { scale } from "svelte/transition";

    export let name: string;

    let expanded = false;

    function scaleY(node: Node, { duration = 100, easing = cubicInOut }) {
        return {
            duration,
            easing,
            css: (t: number) => `transform: scaleY(${t})`
        }
    }
</script>

<div class="flex flex-col ">
    <button class="fill-gray-button" on:click={() => expanded = !expanded}>
        <span class="align-middle">{name}</span>
        <img src={expanded? 'icons/expand-less.svg' : 'icons/expand-more.svg'} alt={expanded? 'expand more' : 'expand less'} class="inline-block align-middle"/>
    </button>

    {#if expanded}
    <div class="flex flex-col origin-top" transition:scaleY={{}}>
        <slot/>
    </div>
    {/if}
</div>

