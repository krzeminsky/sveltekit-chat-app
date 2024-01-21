<script lang="ts">
    export let src: string;
    export let alt: string;
</script>

<button class="flex-shrink-0 main-gradient rounded-full brightness-100 hover:brightness-95 active:brightness-90 transition-all" on:click>
    <img {src} {alt} class="p-2" />
</button>