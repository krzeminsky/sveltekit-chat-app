import type Dialog from "../dialog.svelte";

export function showConfirmDialog(dialog: Dialog, title: string, submitAction: () => void) {
    dialog.showDialog({ title, submitText: "Confirm", submitAction });
}