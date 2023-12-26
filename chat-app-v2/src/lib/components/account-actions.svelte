<script lang="ts">
    export let actions: { route: string, text: string }[];

    export let showActions: boolean;
</script>

{#each actions as a}
<a href={a.route} class="py-2 px-3 bg-white hover:bg-gray-200 transition-all" on:mouseup={() => showActions = false}>{a.text}</a>
{/each}