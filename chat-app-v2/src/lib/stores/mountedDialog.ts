import Dialog from "$lib/components/dialog/dialog.svelte";
import { writable } from "svelte/store";

export const mountedDialog = writable<Dialog>();