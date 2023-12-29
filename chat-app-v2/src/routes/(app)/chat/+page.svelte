<script lang="ts">
    import { SocketWrapper } from "$lib/chat/socket-wrapper";
    import { onDestroy } from "svelte";
    import type { PageData } from "../$types";
    import { io } from "socket.io-client";

    export let data: PageData;

    const socket = new SocketWrapper(io("http://localhost:3000", { auth: { sessionId: data.session!.sessionId } }), {
        connected(data) {
            
        },

        messageReceived(message) {
            
        },

        messageDeleted(messageId, chatId) {
            
        },

        groupChatCreated(data, systemMessage) {
            
        },

        groupChatDeleted(chatId) {
            
        },

        chatMemberLeft(chatId, member, newOwner, systemMessage) {
            
        },

        chatMemberAdded(chatId, member, systemMessage) {
            
        },

        chatMemberRemoved(chatId, member, systemMessage) {
            
        },

        chatNameSet(chatId, chatName, systemMessage) {
            
        },

        chatCoverSet(chatId, coverId, systemMessage) {
            
        },

        chatNicknameSet(chatId, member, nickname, systemMessage) {
            
        },

        chatMemberRankChanged(chatId, member, rank, systemMessage) {
            
        },

        messageReactionsSet(chatId, messageId, reactions) {
            
        },

        userBlockStateChanged(user, state) {
            
        },
    });

    onDestroy(() => {
        socket.dispose();
    })
</script>