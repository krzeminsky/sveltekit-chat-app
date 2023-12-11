<script lang="ts">
    import ProgressIndicator from "../utils/progress-indicator.svelte";

    export let urlPromise: Promise<string>;
</script>

<div class="w-14 h-14 rounded-full m-1 mr-3 float-left overflow-hidden">
    {#await urlPromise}
    <ProgressIndicator/>
    {:then src}
    <img {src} alt="chat cover" class="h-full"/>
    {:catch}
    <img src="default-chat-cover.png" alt="chat cover" class="h-full"/>
    {/await}
</div>