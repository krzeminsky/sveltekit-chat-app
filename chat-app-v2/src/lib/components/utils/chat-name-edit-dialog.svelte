<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import SubmitButton from "../form/submit-button.svelte";
    import TextInput from "../form/text-input.svelte";
    import Dialog from "./dialog.svelte";

    export let originalValue: string|undefined;
    let value = originalValue;

    let dialog: Dialog;
    const dispatch = createEventDispatcher();

    export function showDialog() {
        value = originalValue;
        dialog.showDialog();
    }

    function setName() {
        dispatch('nameSet', value);
    }
</script>

<Dialog title="Edit chat name" bind:this={dialog}>
    <form class="flex flex-col gap-2" on:submit={setName}>
        <input type="text" placeholder="Chat name" class="border-2 py-2 px-4 w-full rounded-2xl border-gray-200 outline-none focus:border-gray-400 transition-all" bind:value />
        
        <button class="button w-full">Set</button>
    </form>
</Dialog>