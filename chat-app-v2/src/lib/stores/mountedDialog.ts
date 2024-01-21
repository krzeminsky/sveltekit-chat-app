import Dialog from "$lib/components/refactored/dialog/dialog.svelte";
import { writable } from "svelte/store";

export const mountedDialog = writable<Dialog>();