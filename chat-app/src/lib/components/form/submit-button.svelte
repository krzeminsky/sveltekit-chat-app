<script lang="ts">
    import ProgressIndicator from "../utils/progress-indicator.svelte";

    export let awaitingResponse = false;
    export let disabled = false;

    $: blockSubmit = disabled || awaitingResponse;
</script>

<button {disabled} class="w-full bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-center transition-all p-2 text-white {blockSubmit? 'pointer-events-none opacity-50' : ''}">
    {#if awaitingResponse}
    <ProgressIndicator/>
    {:else}
    Submit
    {/if}
</button>