<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { scale } from "svelte/transition";
    import IconTextButton from "./icon-text-button.svelte";

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
    <IconTextButton text={name} src={expanded? 'icons/expand-less.svg' : 'icons/expand-more.svg'} alt={expanded? 'expand more' : 'expand less'} reverse={true} on:click={() => expanded = !expanded}/>

    {#if expanded}
    <div class="flex flex-col origin-top" transition:scaleY={{}}>
        <slot/>
    </div>
    {/if}
</div>

