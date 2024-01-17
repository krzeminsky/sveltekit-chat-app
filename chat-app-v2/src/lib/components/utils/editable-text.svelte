<script lang="ts">
    export let value: string;
</script>

<button class="relative group flex items-center gap-2" on:click>
    <h1 class="hide-text-overflow">{value}</h1>
    
    <img src="icons/edit.svg" alt="edit" class="absolute mx-2 top-1/2 left-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all"/>
</button>