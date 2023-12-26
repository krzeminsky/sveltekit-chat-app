<script lang="ts">
    export let urlPromise: Promise<string|null>;
    export let size: number;

    let fixedHeight = size;

    $: urlPromise.then(url => {     
        if (!url) {
            fixedHeight = size;
            return;
        }

        const img = new Image();
        img.src = url;
        img.onload = () => fixedHeight = size * Math.max(1, img.height / img.width);
    });
</script>

{#await urlPromise}
<div class="aspect-square" style="height: {size}px"></div>
{:then url}
<div class="pointer-events-none relative aspect-square rounded-full overflow-hidden" style="height: {size}px">
    <img src="{url??'default-user-avatar.png'}" alt="avatar" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style="height: {fixedHeight}px"/>
</div>
{/await}