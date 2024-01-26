<script lang="ts">
    import { fade } from "svelte/transition";
    import type { LayoutData } from "./$types";
    import { sineInOut } from "svelte/easing";
    import Cover from "$lib/components/cover.svelte";
    import { fetchUserAvatar } from "$lib/utils/fetch-user-avatar";
    import AccountActions from "$lib/components/account-actions.svelte";
    import { onMount } from "svelte";

    export let data: LayoutData;

    let showAccountActions = false;
    let mounted = false;

    onMount(() => mounted = true);


    function hideAccountActionsOnWindowClick(e: Event) {
        if (e.target instanceof HTMLElement) {
            if (e.target.classList.contains('account-actions') || e.target.parentElement?.classList.contains("account-actions")) return;
            showAccountActions = false;
        }
    }
</script>

<svelte:window on:mousedown={hideAccountActionsOnWindowClick} />

<div class="fixed top-0 left-0 h-14 w-full bg-white z-10">
    <div class="absolute top-1/2 -translate-y-1/2 right-8">
        {#if data.session}
        <div class="flex items-center gap-3">
            <h1>Logged in as <span class="text-gradient">{data.session.user.username}</span></h1>
            
            <div class="relative">
                <button class="account-actions" on:click={() => showAccountActions = !showAccountActions}>
                    {#if mounted}
                    <Cover urlPromise={fetchUserAvatar(data.avatar)} size={32}/>
                    {:else}
                    <div class="aspect-square h-8"/>
                    {/if}
                </button>

                {#if showAccountActions}
                <div class="text-center account-actions absolute top-full left-1/2 -translate-x-1/2 flex flex-col overflow-hidden border-2 bg-white border-gray-200 rounded-2xl" transition:fade={{duration: 100, easing: sineInOut}}>
                    <AccountActions bind:showActions={showAccountActions} actions={[
                        { route: "/", text: "Home" }, 
                        { route: "/account", text: "Account" },
                        { route: "/chat", text: "Chat" },
                        { route: "/logout", text: "Logout" }
                    ]}/>
                </div>
                {/if}
            </div>
        </div>
        {:else}
        <a href="/login">Log in</a>
        {/if}
    </div>
</div>

<slot/>