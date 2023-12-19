<script lang="ts">
    export let urlPromise: Promise<string>;
    export let owner: string;
    export let onDelete: (() => void)|undefined;
</script>

<div>
    <h1 class="text-sm {onDelete? 'text-right' : ''}">{owner}</h1>

    <div class="flex gap-2 {onDelete? 'flex-row-reverse' : ''}">
        {#await urlPromise then src}
        <img {src} class="max-w-sm max-h-96" alt="attachment" />
        {#if onDelete}
        <button class="delete" on:click={onDelete}>
            <img src="icons/close.svg" alt="close" class="h-6"/>
        </button>
        {/if}
        {:catch}
        <div class="py-2 px-5 bg-indigo-500 text-white w-fit rounded-full italic">
            Could not load the attachment
        </div>
        {/await}
    </div>
</div>