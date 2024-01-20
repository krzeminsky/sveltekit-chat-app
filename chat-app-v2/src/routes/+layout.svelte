<script lang="ts">
    import Dialog from "$lib/components/refactored/dialog/dialog.svelte";
    import { afterUpdate, onMount } from "svelte";
    import "../app.postcss";
    import { mountedDialog } from "$lib/stores/mountedDialog";

    let dialog: Dialog;

    $: mountedDialog.set(dialog);
</script>

<slot />

<Dialog bind:this={dialog} />