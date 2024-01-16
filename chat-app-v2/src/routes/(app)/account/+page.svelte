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
    import EditableChatCover from "$lib/components/utils/editable-chat-cover.svelte";

    export let data: LayoutData;

    let editAvatarDialog: Dialog;
    let editUsernameDialog: Dialog;

    let uploadAvatarForm: HTMLFormElement;

    let mounted = false;

    onMount(() => mounted = true);
</script>

{#if data && data.session}
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-14 flex gap-4 items-center">
    <EditableChatCover size={128} urlPromise={fetchUserAvatar(data.avatar)} on:click={editAvatarDialog.showDialog}/>

    <button class="group flex items-center gap-2" on:click={editUsernameDialog.showDialog}>
        <h1 class="text-3xl">{data.session.user.username}</h1>
        
        <img src="icons/edit.svg" alt="edit" class="opacity-0 group-hover:opacity-100 transition-all"/>
    </button>
</div>
{/if}

<Dialog title="Edit avatar" bind:this={editAvatarDialog}>
    <div class="flex gap-16">
        <form method="POST" action="?/uploadAvatar" enctype="multipart/form-data" use:enhance on:submit bind:this={uploadAvatarForm}>
            <label class="icon-button">
                <img src="icons/upload.svg" alt="upload"/>
                
                <input name="avatar" type="file" accept="image/*" hidden on:change={() => uploadAvatarForm.requestSubmit()}/>
                
                Upload image
            </label>
        </form>
    
        <form method="POST" action="?/deleteAvatar" on:submit use:enhance>
            <button class="icon-button">
                <img src="icons/delete.svg" alt="delete"/>
        
                Delete
            </button>
        </form>
    </div>
</Dialog>

<Dialog title="Edit username" bind:this={editUsernameDialog}>
    <FormWrapper center={false}>
        <form class="flex flex-col gap-2" method="POST" action="?/changeUsername" on:submit use:enhance>
            <TextInput name="newUsername" label="New username" placeholder="New username" maxlength={16} description="Max 16 non-special characters"/>

            <SubmitButton disabled={true} />

            <small>Database was not designed with changing nicknames in mind, I'm too lazy to remake it</small>
        </form>
    </FormWrapper>
</Dialog>