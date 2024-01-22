<script lang="ts">
    export let urlPromise: Promise<string|null>;
    export let size: number;
    
    let container: HTMLElement;
    $: if (container) constructImage(urlPromise);

    // total: hours spent here: about 4
    // there has to be a 'svelte' way to do this, but I'm too tired
    async function constructImage(url: Promise<string|null>) {    
        const img = new Image();
        const resUrl = await url;

        if (!resUrl) {
            img.src = 'default-user-avatar.png';
            img.style.height = `${size}px`;
        } else {
            img.src = resUrl;
            
            await new Promise<void>(resolve => {
                img.onload = () => {
                    const fixedSize = size * Math.max(1, img.height / img.width);
                    img.style.height = `${fixedSize}px`

                    resolve();
                }
            });
        }

        container.replaceChildren(img);
    }
    
</script>

<div class="relative flex-shrink-0 align-middle aspect-square pointer-events-none rounded-full overflow-hidden flex justify-center items-center" style="height: {size}px" bind:this={container} />