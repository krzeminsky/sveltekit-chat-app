<script lang="ts">
    import ProgressIndicator from "../utils/progress-indicator.svelte";

    export let urlPromise: Promise<string|null>;
</script>

{#await urlPromise}
<div class="px-5 py-2 text-gray-300 border-2 border-gray-300 flex items-center gap-2">
    <ProgressIndicator fillColor="rgb(209 213 219)" />
    Attachment
</div>
{:then src}
{#if src}
<div>
    <img {src} class="max-h-52 max-w-96 rounded-lg" alt="attachment" />
</div>
{:else}
<h1 class="px-5 py-2 break-words text-gray-300 border-2 border-gray-300">Couldn't load the attachment</h1>
{/if}
{/await}