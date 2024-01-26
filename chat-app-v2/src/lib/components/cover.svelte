<script lang="ts">
    export let urlPromise: Promise<string|null>;
    export let size: number;

    let naturalHeight: number;
    let naturalWidth: number;

    $: fixedSize = naturalHeight && naturalWidth? size * Math.max(1, naturalHeight / naturalWidth) : undefined;
</script>

<div class="relative flex-shrink-0 align-middle aspect-square pointer-events-none rounded-full overflow-hidden flex justify-center items-center" style="height: {size}px">
    {#await urlPromise then url}
    <img src={url??'default-user-avatar.png'} alt="avatar" class="{fixedSize? 'block' : 'hidden'}" style="height: {fixedSize}px" bind:naturalWidth bind:naturalHeight />
    {/await}
</div>