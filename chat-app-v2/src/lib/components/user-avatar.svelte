<script lang="ts">
    export let urlPromise: Promise<string|null>;
    export let size: number;

    let fixedHeight = size;

    $: urlPromise.then(url => {     
        if (!url) {
            fixedHeight = size;
            return;
        }

        // ! this block might be causing image lag
        const img = new Image();
        img.src = url;
        img.onload = () => fixedHeight = size * Math.max(1, img.height / img.width);
    });
</script>

<div class="relative aspect-square pointer-events-none rounded-full overflow-hidden" style="height: {size}px">
    {#await urlPromise then url}
    <img src="{url??'default-user-avatar.png'}" alt="avatar" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="height: {fixedHeight}px"/>
    {/await}
</div>