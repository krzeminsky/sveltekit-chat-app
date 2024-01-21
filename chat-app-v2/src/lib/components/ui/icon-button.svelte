<script lang="ts">
    export let src: string;
    export let alt: string;
</script>

<button class="flex-shrink-0 g-transparent hover:bg-gray-100 active:bg-gray-200 transition-all rounded-full" on:click>
    <img {src} {alt} class="p-2" />
</button>