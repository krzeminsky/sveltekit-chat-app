<script lang="ts">
    import { AuthError } from "$lib/validation/auth-error";

    export let error: AuthError = AuthError.None;
    export let center = true;

    $: errorMessage = getErrorMessage(error);

    function getErrorMessage(e: AuthError) {
        switch (e) {
            case AuthError.None: return "";
            case AuthError.Unknown: return "Something went wrong!";
            case AuthError.UsernameInUse: return "This username is already in use!";
            case AuthError.CredentialsMismatch: return "Username and password don't match!";
        }
    }
</script>

<div class="{center? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''} flex flex-col items-center gap-4">
    <slot />

    <small class="text-red-500 text-center">{errorMessage}</small>
</div>