import Dialog from "../dialog.svelte";
import CreateGroupChatDialogBody from "../bodies/create-group-chat-dialog-body.svelte";
import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
import type { SearchResult } from "$lib/chat/types";

export function showCreateGroupChatDialog(dialog: Dialog, attachmentHandler: SocketAttachmentHandler, searchHandler: (val: string) => Promise<SearchResult>, lockedMember: string, onCreate: (members: string[]) => void) {
    const changeAllowSubmit = dialog.changeAllowSubmit;

    dialog.showDialog({
        title: "Create group chat",
        submitText: "Create",
        submitAction: (component: CreateGroupChatDialogBody) => onCreate(component.chatMembers)
    }, {
        body: CreateGroupChatDialogBody,
        props: {
            chatMembers: [lockedMember],
            attachmentHandler,
            searchHandler,
            changeAllowSubmit
        }
    });
}