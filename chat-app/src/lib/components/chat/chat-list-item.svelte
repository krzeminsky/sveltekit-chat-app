<script lang="ts">
    import ChatCover from "./chat-cover.svelte";

    export let chatCoverUrl: Promise<string>;
    export let name: string;
    export let onClick: () => void;
</script>

<button on:click={onClick} class="rounded-2xl hover:bg-blue-50 transition-all">
    <div class="w-full h-16">
        <ChatCover urlPromise={chatCoverUrl}/>
    
        <div class="h-full flex flex-col justify-center text-left">
            <h1 class="text-lg overflow-ellipsis overflow-hidden whitespace-nowrap">{name}</h1>
            <slot name="content"/>
        </div>
    </div>
</button>