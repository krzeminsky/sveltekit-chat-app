<script lang="ts">
    import Dialog from "$lib/components/dialog/dialog.svelte";
    import "../app.postcss";
    import { mountedDialog } from "$lib/stores/mountedDialog";

    let dialog: Dialog;

    $: mountedDialog.set(dialog);
</script>

<slot />

<Dialog bind:this={dialog} />