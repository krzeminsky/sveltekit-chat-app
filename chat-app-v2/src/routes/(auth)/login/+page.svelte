<script lang="ts">
    import AuthForm from "$lib/components/form/auth-form.svelte";
    import PasswordInput from "$lib/components/form/password-input.svelte";
    import TextInput from "$lib/components/form/text-input.svelte";
    import { formSchema } from "$lib/validation/schema";

    let usernameError = false;
    let passwordError = false;

    let awaitingResponse = false;
</script>

<svelte:head>
    <title>Log in</title>
</svelte:head>

<AuthForm title="Log in" counterPageRoute="/signup" counterPageMessage="Sign up" bind:awaitingResponse onSubmit={(data, cancel) => {
    usernameError = false;
    passwordError = false;
    
    const parseResult = formSchema.safeParse(Object.fromEntries(data));

    if (!parseResult.success) {
        const error = parseResult.error.flatten();

        usernameError = !!error.fieldErrors.username;
        passwordError = !!error.fieldErrors.password;

        cancel();
    }
}}>
    <TextInput name="username" label="Username" placeholder="Username" invalid={usernameError} disabled={awaitingResponse} />

    <PasswordInput invalid={passwordError} disabled={awaitingResponse} />
</AuthForm>