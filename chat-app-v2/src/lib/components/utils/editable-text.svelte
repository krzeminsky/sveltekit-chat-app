<script lang="ts">
    export let value: string;
</script>

<button class="group flex items-center gap-2" on:click>
    <h1 class="hide-text-overflow">{value}</h1>
    
    <img src="icons/edit.svg" alt="edit" class="opacity-0 group-hover:opacity-100 transition-all"/>
</button>