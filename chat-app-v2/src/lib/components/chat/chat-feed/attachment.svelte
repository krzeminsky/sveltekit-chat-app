<script lang="ts">
    import ProgressIndicator from "$lib/components/ui/progress-indicator.svelte";

    export let urlPromise: Promise<{ url: string, type: string, name: string}|null>;
</script>

{#await urlPromise}
<div class="attachment w-full h-full attachment-border grid place-content-center">
    <ProgressIndicator fillColor="rgb(209, 213, 219)" size={48} />
</div>
{:then data}
    {#if data}
        {#if data.type.slice(0, 5) == "image"}
        <img src="{data.url}" alt="attachment" class="attachment rounded-lg" />
        {:else}
        <a href={data.url} download class="attachment-text attachment-border">{data.name}</a>
        {/if}
    {:else}
    <h1 class="attachment-text attachment-border">Failed to load the attachment</h1>
    {/if}
{/await}

<style lang="postcss">
    .attachment {
        max-height: 12rem;
        max-width: min(24rem, 80%);
    }

    .attachment-border {
        @apply border-2 border-gray-300 rounded-lg;
    }

    .attachment-text {
        @apply px-4 py-2 max-w-[80%];
    }
</style>