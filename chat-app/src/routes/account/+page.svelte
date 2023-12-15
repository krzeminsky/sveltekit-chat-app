<script lang="ts">
    import { enhance } from "$app/forms";
    import type { PageData } from "./$types";

    export let data: PageData;

    let files: FileList;

    function setFormData(formData: FormData) {
        formData.set('avatar', files[0]);
    }
</script>

<svelte:head>
    <title>Account</title>
</svelte:head>

<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
    {#if data?.user}
    <h1 class="text-3xl">Welcome back <span class="bg-clip-text text-transparent bg-gradient-to-tr from-indigo-500 to-purple-500">{data.user.username}</span></h1>
    <form method="post">
        <button formaction="/logout" class="w-24 text-white bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-center p-2">
            Logout
        </button>
    </form>

    <form method="post" enctype="multipart/form-data" use:enhance={({ formData }) => {
        setFormData(formData);
    }}>
        <div class="flex items-center gap-4">
            <h1>Update avatar:</h1>
            
            <input name="avatar" type="file" bind:files={files}/>

            <button formaction="?/updateAvatar" class="w-24 text-white bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-center p-2">
                Submit
            </button>
        </div>
    </form>
    {:else}
    <a href="/login" class="w-24 text-white bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl text-center p-2">Log in</a>
    {/if}
</div>