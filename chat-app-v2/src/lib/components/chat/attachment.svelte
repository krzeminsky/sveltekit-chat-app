<script lang="ts">
    export let urlPromise: Promise<string|null>;
</script>

{#await urlPromise then src}
    {#if src}
    <img {src} class="max-h-52 max-w-96 rounded-lg" alt="attachment" />
    {:else}
    <span class="px-5 py-2 break-words text-gray-300 border-2 border-gray-300">Couldn't load the attachment</span>
    {/if}
{/await}