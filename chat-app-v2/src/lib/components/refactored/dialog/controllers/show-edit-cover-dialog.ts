import EditCoverDialogBody from "../bodies/edit-cover-dialog-body.svelte";
import Dialog from "../dialog.svelte";

export function showEditCoverDialog(dialog: Dialog, title: string, onSubmit: (file: FileList|null) => void, actionData?: { uploadPath: string, deletePath: string }) {
    dialog.showDialog({
        title,
        submitAction: (component: EditCoverDialogBody) => onSubmit(component.files)
    }, {
        body: EditCoverDialogBody,
        props: {
            actionData
        }
    })
}