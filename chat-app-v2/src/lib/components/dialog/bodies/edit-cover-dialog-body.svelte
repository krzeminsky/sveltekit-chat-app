<script lang="ts">
    import { enhance } from "$app/forms";
    
    export let actionData: { uploadPath: string, deletePath: '' }|undefined = undefined;

    const dialogFormProps = {
        upload: actionData? {
            enctype: "multipart/form-data",
            method: "POST",
            action: actionData.uploadPath
        } : {},

        delete: actionData? {
            method: "POST",
            actopm: actionData.deletePath
        } : {}
    }

    export let files: FileList|null = null;

    let uploadForm: HTMLFormElement;

    function semiEnhance(node: HTMLFormElement) {
        if (actionData) enhance(node)
    }
</script>

<svelte:options accessors={true}/>

<div class="flex gap-16">
    <form {...dialogFormProps.upload} on:submit use:semiEnhance bind:this={uploadForm}>
        <label class="icon-button">
            <img src="icons/upload.svg" alt="upload"/>
            
            <input name="avatar" type="file" accept="image/*" hidden bind:files on:change={() => uploadForm.requestSubmit()}/>
            
            Upload image
        </label>
    </form>

    <form {...dialogFormProps.delete} use:semiEnhance on:submit>
        <button class="icon-button" on:click={() => files = null}>
            <img src="icons/delete.svg" alt="delete"/>
    
            Delete
        </button>
    </form>
</div>