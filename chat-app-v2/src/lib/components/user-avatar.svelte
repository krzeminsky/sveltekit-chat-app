<script lang="ts">
    export let urlPromise: Promise<string|null>;
    export let size: number;
    
    let fixedSize: number|undefined;
    let img: HTMLImageElement;

    $: {
        fixedSize = undefined;
        
        if (img) {
            fixedSize = size * Math.max(1, img.height / img.width);
            img.height = fixedSize;
        }
    }
</script>

<div class="relative inline-block align-middle aspect-square pointer-events-none rounded-full overflow-hidden" style="height: {size}px">
    {#await urlPromise then url}
    <img src="{url??'default-user-avatar.png'}" alt="avatar" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="height: {fixedSize}px;" bind:this={img} />
    {/await}
</div>