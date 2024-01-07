<script lang="ts">
    export let attachments: File[];

    function deleteAttachment(a: File) {
        attachments.splice(attachments.indexOf(a), 1);
        attachments = attachments;
    }
</script>

{#if attachments.length > 0}
<div class="flex gap-2 flex-wrap pt-2">
    {#each attachments as a}
    <button class="flex-shrink-0 px-4 py-2 border-2 border-gray-300 rounded-full" on:click={() => deleteAttachment(a)}>
        {a.name}
        <img src="icons/delete.svg" alt="delete attachment" class="inline-block" />
    </button>
    {/each}
</div>
{/if}