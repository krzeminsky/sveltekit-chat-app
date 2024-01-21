import EditValueDialogBody from "../bodies/edit-value-dialog-body.svelte";
import type Dialog from "../dialog.svelte";

export function showEditValueDialog(dialog: Dialog, title: string, value: string, placeholder: string, onSubmit: (val: string) => void) {
    dialog.showDialog({ 
        title, 
        submitText: "Set", 
        submitAction: (component: EditValueDialogBody) => {
            if (component.value != value) onSubmit(component.value)
        }
    }, { 
        body: EditValueDialogBody, 
        props: { 
            value,
            placeholder
        } 
    });
}