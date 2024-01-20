import type { SocketAttachmentHandler } from "$lib/chat/socket-attachment-handler";
import type { SearchResult } from "$lib/chat/types";
import AddChatMemberDialogBody from "../bodies/add-chat-member-dialog-body.svelte";
import Dialog from "../dialog.svelte";

export function showAddChatMemberDialog(dialog: Dialog, attachmentHandler: SocketAttachmentHandler, searchHandler: (val: string) => Promise<SearchResult>, onSelect: (member: string) => void) {    
    dialog.showDialog({
        title: "Add chat member",
        submitAction: (component: AddChatMemberDialogBody) => onSelect(component.selected!)
    }, {
        body: AddChatMemberDialogBody,
        props: {
            attachmentHandler,
            searchHandler
        }
    })
}