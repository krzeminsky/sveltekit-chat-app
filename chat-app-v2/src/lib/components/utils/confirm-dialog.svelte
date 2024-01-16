<script lang="ts">
    import Dialog from "./dialog.svelte";

    export let title: string;
    export let action: () => void;

    let dialog: Dialog;
    
    export function showDialog() { dialog.showDialog(); }
</script>

<Dialog {title} bind:this={dialog}>
    <button on:click={() => { action(); dialog.closeDialog() }}>Confirm</button>
</Dialog>