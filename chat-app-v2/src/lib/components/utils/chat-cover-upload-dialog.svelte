<script lang="ts">
    import Dialog from "$lib/components/utils/dialog.svelte";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    let dialog: Dialog;
    let uploadForm: HTMLFormElement;
    let files: FileList;

    function deleteCover() {
        dispatch('deleteCover');
    }

    function uploadCover() {
        dispatch('uploadCover', files.item(0));
    }

    export function showDialog() {
        dialog.showDialog();
    }
</script>

<Dialog title="Uplaod chat cover" bind:this={dialog}>
    <div class="flex gap-16">
        <form on:submit={uploadCover} bind:this={uploadForm}>
            <label class="icon-button">
                <img src="icons/upload.svg" alt="upload"/>
                
                <input name="avatar" type="file" accept="image/*" hidden bind:files on:change={() => uploadForm.requestSubmit()}/>
                
                Upload image
            </label>
        </form>

        <form on:submit={deleteCover}>
            <button class="icon-button">
                <img src="icons/delete.svg" alt="delete"/>
        
                Delete
            </button>
        </form>
    </div>
</Dialog>
