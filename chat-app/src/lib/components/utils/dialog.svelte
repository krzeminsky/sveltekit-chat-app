<script lang="ts">
    export let show: boolean;
</script>

{#if show}
<div class="absolute w-full h-full bg-black bg-opacity-70">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-white rounded-3xl">
        <button on:click={() => show = false}>
            <img src="icons/close.svg" alt="close"/>
        </button>
        <slot/>
    </div>
</div>
{/if}