<script lang="ts">
    import UserAvatar from "$lib/components/user-avatar.svelte";
    import type { LayoutData } from "../$types";
    import Dialog from "$lib/components/utils/dialog.svelte";
    import { enhance } from "$app/forms";
    import { fetchUserAvatar } from "$lib/utils/fetch-user-avatar";
    import { onMount } from "svelte";
    import TextInput from "$lib/components/form/text-input.svelte";
    import FormWrapper from "$lib/components/form/form-wrapper.svelte";
    import SubmitButton from "$lib/components/form/submit-button.svelte";

    export let data: LayoutData;

    let showAvatarEditDialog = false;


    let showUsernameEditDialog = false;
    let awaitingForUsernameEditAction = false;

    let uploadAvatarForm: HTMLFormElement;

    let mounted = false;

    onMount(() => mounted = true);
</script>

{#if data && data.session}
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-14 flex gap-4 items-center">
    <div class="relative h-32 w-32 rounded-full overflow-hidden">
        <button class="peer" on:click={() => showAvatarEditDialog = true}>
            {#if mounted}
            <UserAvatar urlPromise={fetchUserAvatar(data.avatar)} size={128}/>
            {:else}
            <div class="aspect-square h-32"/>
            {/if}
        </button>

        <div class="absolute top-0 left-0 pointer-events-none w-full h-full bg-black bg-opacity-30 z-10 opacity-0 peer-hover:opacity-100 transition-all">
            <img src="icons/edit-white.svg" alt="edit" class="absolute h-16 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        </div>
    </div>

    <button class="group flex items-center gap-2" on:click={() => showUsernameEditDialog = true}>
        <h1 class="text-3xl">{data.session.user.username}</h1>
        
        <img src="icons/edit.svg" alt="edit" class="opacity-0 group-hover:opacity-100 transition-all"/>
    </button>
</div>
{/if}

<Dialog title="Edit avatar" bind:show={showAvatarEditDialog}>
    <div class="flex gap-16">
        <form method="POST" action="?/uploadAvatar" enctype="multipart/form-data" bind:this={uploadAvatarForm} use:enhance={() => {
            return async ({ update }) => {
                await update();
                showAvatarEditDialog = false;
            }
        }}>
            <label class="icon-button">
                <img src="icons/upload.svg" alt="upload"/>
                
                <input name="avatar" type="file" accept="image/*" hidden on:change={() => uploadAvatarForm.requestSubmit()}/>
                
                Upload image
            </label>
        </form>
    
        <form method="POST" action="?/deleteAvatar"use:enhance={() => {
            return async ({ update }) => {
                await update();
                showAvatarEditDialog = false;
            }
        }}>
            <button class="icon-button">
                <img src="icons/delete.svg" alt="delete"/>
        
                Delete
            </button>
        </form>
    </div>
</Dialog>

<Dialog title="Edit username" bind:show={showUsernameEditDialog}>
    <FormWrapper center={false}>
        <form class="flex flex-col gap-2" method="POST" action="?/changeUsername" use:enhance={() => {
            awaitingForUsernameEditAction = true;

            return async ({ update }) => {
                await update();

                awaitingForUsernameEditAction = false;
                showUsernameEditDialog = false;
            }
        }}>
            <TextInput name="newUsername" label="New username" placeholder="New username" maxlength={16} description="Max 16 non-special characters"/>

            <SubmitButton disabled={true} awaitingResponse={awaitingForUsernameEditAction} />

            <small>Database was not designed with changing nicknames in mind, I'm too lazy to remake it</small>
        </form>
    </FormWrapper>
</Dialog>