<script lang="ts">
    import type { SearchResult } from "$lib/chat/types";

    export let searchHandler: (val: string) => Promise<SearchResult>;
    export let label = '';

    export let ignoreList: string[] = [];
    
    export let searchValue = '';
    export let searchResults: SearchResult|undefined;
    
    let searchTimer: NodeJS.Timeout;

    $: {
        if (searchValue) {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(search, 1000);
        } else searchResults = undefined;
    }

    async function search() {
        const results = await searchHandler(searchValue);
        if (searchValue) {
            results.users = results.users.filter(u => !ignoreList.includes(u));

            if (results.users.length == 0) return;

            searchResults = results;
        }
    }
</script>

<div class="relative w-full">
    <h1 class="text-3xl text-gradient">{label}</h1>
    <input type="search" placeholder="Search..." class="w-full mt-2 px-4 py-2 border-2 focus:outline-none rounded-full" bind:value={searchValue}/>
    <slot />
</div>