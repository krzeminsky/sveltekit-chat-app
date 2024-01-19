<script lang="ts">
    import Dialog from "./dialog.svelte";

    let action: () => void;

    let dialog: Dialog;
    let title: string;
    
    export function showDialog(dialogTitle: string, dialogAction: () => void) { 
        title = dialogTitle;
        action = dialogAction;
        dialog.showDialog();
    }
</script>

<Dialog {title} bind:this={dialog}>
    <button class="button" on:click={() => { action(); dialog.closeDialog() }}>Confirm</button>
</Dialog>