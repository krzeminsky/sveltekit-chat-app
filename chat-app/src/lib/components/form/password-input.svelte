<script lang="ts">
    import TextInput from "./text-input.svelte";

    export let description = "";
    export let invalid = false;
    export let disabled = false;

    let showPassword = false;
</script>

<TextInput name="password" placeholder="Password" autocomplete="none" label="Password" type={showPassword? 'text' : 'password'} {invalid} {description} {disabled} on:input>
    <button class="absolute right-2 top-1/2 -translate-y-1/2" type="button" on:click={() => showPassword = !showPassword}>
        <img src="{showPassword? 'icons/vis-on.svg' : 'icons/vis-off.svg'}" alt="Switch visibility" class="h-8"/>
    </button>
</TextInput>