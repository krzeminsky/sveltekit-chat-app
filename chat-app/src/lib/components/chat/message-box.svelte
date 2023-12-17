<script lang="ts">
    export let content: string;
    export let owner: string;
    export let onDelete: (() => void)|undefined;
</script>

<div class="flex gap-2 {onDelete? 'flex-row-reverse' : ''}">
    <div class="{owner == ""? 'w-full text-center text-gray-500' : 'py-2 px-5 bg-indigo-500 text-white w-fit rounded-full'}">
        {content}
    </div>

    {#if onDelete}
    <button class="delete" on:click={onDelete}>
        <img src="icons/close.svg" alt="close" class="h-6"/>
    </button>
    {/if}
</div>