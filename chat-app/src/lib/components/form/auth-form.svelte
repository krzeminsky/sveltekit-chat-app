<script lang="ts">
    import { enhance } from "$app/forms";
    import { AuthError } from "$lib/validation/auth-error";
    import FormWrapper from "./form-wrapper.svelte";
    import SubmitButton from "./submit-button.svelte";

    export let title: string;
    export let counterPageRoute: string;
    export let counterPageMessage: string;

    export let onSubmit: (data: FormData, cancel: () => void) => void;
    export let awaitingResponse = false;

    let error: AuthError = AuthError.None;

    // ? svelte inline typescript is stupid 
    function setError(e: unknown) { error = e as AuthError; } 
</script>

<FormWrapper {error}>
    <form class="w-72 flex flex-col items-center gap-4" method="post" use:enhance={({ formData, cancel }) => {
        awaitingResponse = true;

        onSubmit(formData, () => { cancel(); awaitingResponse = false; })

        return async ({ update, result }) => {
            await update({ reset: false });

            if (result.type === "failure" && result.data) setError(result.data.error);

            awaitingResponse = false;
        }
    }}>
        <h1 class="h-14 text-center text-5xl bg-clip-text text-transparent bg-gradient-to-tr from-indigo-500 to-purple-500">{title}</h1>

        <slot />
        
        <SubmitButton disabled={awaitingResponse} awaitingResponse={awaitingResponse} />

        <a href="{counterPageRoute}" class="w-fit underline text-center text-gray-400">{counterPageMessage}</a>
    </form>
</FormWrapper>