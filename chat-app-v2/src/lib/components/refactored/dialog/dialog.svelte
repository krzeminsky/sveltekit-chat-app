<script lang="ts">
    import { cubicInOut } from "svelte/easing";
    import { fade, scale } from "svelte/transition";
    import type { DialogBody } from "./dialog-body";
    import { afterUpdate } from "svelte";

    let title: string;
    let submitText: string|undefined;
    let submitAction: () => void;
    
    let body: DialogBody|undefined;
    let mountedBody: any;

    let show: boolean;
    let disabled = false;

    export function changeAllowSubmit(allowSubmit: boolean) {
        disabled = !allowSubmit;
    }

    export function showDialog<T>(options: { title: string, submitText?: string, submitAction: (component: T) => void }, dialogBody?: DialogBody) { 
        title = options.title;
        submitText = options.submitText;
        submitAction = () => options.submitAction(mountedBody as T);
        
        body = dialogBody;

        show = true;
    }

    function closeOnBackdropClick(e: Event) {
        if (e.target instanceof HTMLElement && e.target.id === "backdrop") {
            show = false;
        }
    }
</script>

<svelte:window on:mousedown={closeOnBackdropClick}/>

{#if show}
<div id="backdrop" class="absolute top-0 left-0 w-full h-full bg-black select-none bg-opacity-20 z-20 cursor-default" transition:fade={{duration: 100, easing: cubicInOut}}>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 min-w-64 min-h-32 bg-white rounded-3xl flex flex-col items-center justify-between gap-2 shadow-lg" on:submit={() => show = false} transition:scale={{duration: 100, easing: cubicInOut}}>
        <h1 class="text-2xl">{title}</h1>

        {#if body} 
        <svelte:component this={body.body} {...body.props} bind:this={mountedBody} />
        {/if}

        {#if submitText}
        <button class="w-full button" {disabled} on:click={() => { show = false; submitAction(); }}>{submitText}</button>
        {/if}

        <button class="opacity-50" on:click={() => show = false}>Cancel</button>
    </div>
</div>
{/if}