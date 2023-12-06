<script lang="ts">
    import AuthForm from "$lib/components/form/auth-form.svelte";
    import PasswordInput from "$lib/components/form/password-input.svelte";
    import TextInput from "$lib/components/form/text-input.svelte";
    import { formSchema } from "$lib/validation/schema";

    let usernameError = false;
    let passwordError = false;
    let confirmError = false;

    let awaitingResponse = false;
</script>

<svelte:head>
    <title>Sign up</title>
</svelte:head>

<AuthForm title="Sign up" counterPageRoute="/login" counterPageMessage="Log in" bind:awaitingResponse onSubmit={(data, cancel) => {
    usernameError = false;
    passwordError = false;
    
    const parseResult = formSchema.safeParse(Object.fromEntries(data));

    confirmError = data.get('password') != data.get('confirmPassword');

    if (!parseResult.success) {
        const error = parseResult.error.flatten();

        usernameError = !!error.fieldErrors.username;
        passwordError = !!error.fieldErrors.password;
        
        cancel();
    } else if (confirmError) cancel();
}}>
    <TextInput name="username" label="Username" placeholder="Username" invalid={usernameError} disabled={awaitingResponse} />

    <PasswordInput description="Must contain at least 8 characters and 1 number" invalid={passwordError} disabled={awaitingResponse} />

    <TextInput name="confirmPassword" label="Confirm password" placeholder="Confirm password" type="password" invalid={confirmError} disabled={awaitingResponse} />
</AuthForm>