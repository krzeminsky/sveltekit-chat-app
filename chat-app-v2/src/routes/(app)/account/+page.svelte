<script lang="ts">
    import type { LayoutData } from "../$types";
    import { fetchUserAvatar } from "$lib/utils/fetch-user-avatar";
    import EditableChatCover from "$lib/components/utils/editable-chat-cover.svelte";
    import { mountedDialog } from "$lib/stores/mountedDialog";
    import { showEditCoverDialog } from "$lib/components/dialog/controllers/show-edit-cover-dialog";

    export let data: LayoutData;

    $: dialog = $mountedDialog;

    function openEditCoverDialog() {
        showEditCoverDialog(dialog, "Edit avatar", _ => {}, {
            uploadPath: "?/uploadAvatar",
            deletePath: "?/deleteAvatar"
        });
    }
</script>

{#if data && data.session}
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-14 flex gap-4 items-center text-3xl">
    <EditableChatCover size={128} urlPromise={fetchUserAvatar(data.avatar)} on:click={openEditCoverDialog}/>

    <h1 class="hide-text-overflow">{data.session.user.username}</h1>
</div>
{/if}