<script lang="ts">
    import { getReactionCount } from "$lib/chat/reactions";

    export let left: boolean;
    export let content: string;
    export let reactions: string;
</script>

<h1 class="w-fit relative px-5 py-2 break-words text-white max-w-96  {left? 
    'bg-gray-600 rounded-r-3xl rounded-l-lg first:rounded-tl-3xl last:rounded-bl-3xl' 
:   'main-gradient rounded-l-3xl rounded-r-lg first:rounded-tr-3xl last:rounded-br-3xl'
}">
{content}
{#if reactions}
<div class="absolute bottom-full right-3 px-2 py-1 bg-gray-800 rounded-full">
    {getReactionCount(reactions)}
</div>
{/if}
</h1>