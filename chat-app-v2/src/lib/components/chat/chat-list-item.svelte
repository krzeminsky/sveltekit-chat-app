<script lang="ts">
    import Cover from "../cover.svelte";

    export let name: string;
    export let coverUrlPromise: Promise<string>;
</script>

<button type="button" on:click class="h-16 w-full flex gap-3 p-2 items-center rounded-2xl transition-all hover:bg-indigo-50">
    <Cover size={52} urlPromise={coverUrlPromise} />
    
    <div class="min-w-0 flex-1 text-left">
        <h1 class="text-lg w-full hide-text-overflow">{name}</h1>
        <slot/>
    </div>
</button>