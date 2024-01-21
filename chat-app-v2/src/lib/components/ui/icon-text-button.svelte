<script lang=ts>
    export let text: string;
    export let src: string|undefined = undefined;
    export let alt: string|null = null;
    export let reverse = false;
</script>

<button class="flex-shrink-0 text-nowrap w-full min-w-max text-left px-4 py-3 bg-transparent hover:bg-gray-100 active:bg-gray-200 rounded-full transition-all" on:click>
    {#if src}
    <img {src} {alt} class="inline-block" />
    {:else}
    <slot/>
    {/if}

    <span class="mx-1 align-middle {reverse? 'float-left' : ''}">{text}</span>
</button>