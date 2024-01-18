<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SubmitButton from "../form/submit-button.svelte";
    import TextInput from "../form/text-input.svelte";
    import Dialog from "./dialog.svelte";

    let value: string;
    let title: string;
    let placeholder: string;
    let action: (newValue: string) => void;

    let dialog: Dialog;

    export function showDialog(startValue: string, dialogTitle: string, valuePlaceholder: string, submitAction: (newValue: string) => void) {
        value = startValue;
        title = dialogTitle;
        placeholder = valuePlaceholder;
        action = submitAction;
        dialog.showDialog();
    }
</script>

<Dialog {title} bind:this={dialog}>
    <form class="flex flex-col gap-2" on:submit={() => action(value)}>
        <input type="text" {placeholder} class="border-2 py-2 px-4 w-full rounded-2xl border-gray-200 outline-none focus:border-gray-400 transition-all" bind:value />
        
        <button class="button w-full">Set</button>
    </form>
</Dialog>