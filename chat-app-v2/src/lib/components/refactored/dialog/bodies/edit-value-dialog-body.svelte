<script lang="ts">
    export let value: string;
    export let placeholder: string;
</script>

<svelte:options accessors={true} />

<input type="text" {placeholder} class="border-2 py-2 px-4 w-full rounded-2xl border-gray-200 outline-none focus:border-gray-400 transition-all" bind:value={value} />