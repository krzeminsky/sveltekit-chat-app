<script lang="ts">
    import Dialog from "./dialog.svelte";

    export let title: string;
    
    let action: () => void;
    let show = false;

    export function showDialog(onConfirm: () => void) {
        show = true;
        action = onConfirm;
    }
</script>

<Dialog {title} bind:show>
    <button on:click={() => { action(); show = false; }}>Confirm</button>
</Dialog>