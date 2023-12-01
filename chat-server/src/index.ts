import polka from "polka";
import { Server } from "socket.io";
import { auth } from "./lucia.js";
import { Chat, dbCall } from "./database.js";

const port = 3000;
const { server } = polka().listen(port);

console.log(`Listening on port ${port}!`);

const io = new Server(server, {
    pingTimeout: 4000,
    pingInterval: 5000,
    maxHttpBufferSize: 1024 * 1024 * 25 // ? 25 Mb
});

console.log('Websocket server started!');


const MAX_CHAT_NAME_LENGTH = 32;
const MAX_NICKANAME_LENGTH = 16;
const DEBUG_HIGHEST_REACTION_INDEX = 3;

//
//
//
//
//
//

// TODO: Implement caching using redis for common db calls like 'getChatMembers'
// TODO: Extract some db checks into transactions, events like 'addChatMember' do 4+ db calls, which is a lot of round trips
// ! usernames cannot contain: , :

function broadcastEvent(targets: string[], eventName: string, ...args: any) {
    for (const t of targets) io.to(t).emit(eventName, args);
}

io.use(async (socket, next) => {
    try {
        const session = await auth.validateSession(socket.handshake.auth.sessionId);

        socket.data.name = session.user.username;
        socket.join(socket.data.name);
    
        return next();
    } catch {
        console.log('rejected connection');
        return next(Error("Unauthorized"));
    }
});

io.on('connection', socket => {
    const name = socket.data.name;

    socket.emit('connected', dbCall.getLatestChatMessages(name));

    socket.on('sendMessage', async (target: number|string, content: string|Blob) => {
        if (!target || !content) return;

        let chatId: number;
        if (typeof target === "number") {
            if (!dbCall.isChatMember(name, target)) return;

            chatId = target;
        } else if (typeof target === "string") {
            const otherBlockList = dbCall.getUserBlockList(target);
            if (!otherBlockList || otherBlockList.includes(name)) return;

            chatId = dbCall.getPrivateChatId(name, target)??dbCall.createChat([name, target]);
        } else return;

        const isAttachment = typeof content !== "string";

        try {
            const message = dbCall.insertMessage(
                name, 
                isAttachment? (await dbCall.insertAttachment(chatId, content)).toString() : content, 
                chatId, +isAttachment
            );

            broadcastEvent(dbCall.getChatMembers(chatId), 'messageReceived', message);
        } catch {
            return;
        }
    });

    socket.on('getMessages', (chatId: number, offset: number, callback) => {
        if (isNaN(chatId) || isNaN(offset) || typeof callback !== "function" || !dbCall.isChatMember(name, chatId)) return;

        callback(dbCall.getChatMessages(chatId, offset, dbCall.getChatMemberBreakPoint(name, chatId)));
    });

    socket.on('getAttachment', (attachmentId: number, callback) => {
        if (isNaN(attachmentId) || typeof callback !== "function") return;

        const data = dbCall.getAttachmentData(attachmentId);
        if (!data) return callback(null);

        if (data.chat_id && !dbCall.isChatMember(name, data.chat_id)) return callback(null);

        const attachment = dbCall.getAttachment(attachmentId);

        callback(new Blob([attachment], { type: data.type }))
    });

    // ? call callback on success
    socket.on('deleteMessage', (messageId: number) => {
        if (isNaN(messageId)) return;

        const owner = dbCall.getMessageOwner(messageId);
        if (!owner) return;

        if (name != owner.username) return;

        broadcastEvent(dbCall.getChatMembers(owner.chat_id), 'messageDeleted', messageId, owner.chat_id);
    });

    socket.on('createGroupChat', (otherMembers: string[]) => {
        if (!Array.isArray(otherMembers) || !otherMembers.every(m => typeof m === "string")) return;

        otherMembers = otherMembers.filter(m => dbCall.userExists(m));
        if (otherMembers.length < 2) return;

        const targets = [name, ...otherMembers];
        const id = dbCall.createChat(targets);

        broadcastEvent(targets, 'groupChatCreated', id, name); // ? chatId, chat creator
    });

    // ? if its a group chat and the socket is the creator of the group chat - delete the chat, if its a private convo - update the break point for the socket
    socket.on('deleteChat', (chatId: number, callback) => {
        if (isNaN(chatId)) return;

        if (dbCall.isChatPrivate(chatId)) {
            dbCall.updateChatBreakPoint(name, chatId);

            if (typeof callback === "function") callback();
        } else if (dbCall.getChatMemberRank(name, chatId) == 2) {
            const members = dbCall.getChatMembers(chatId);
            dbCall.deleteChat(chatId);

            broadcastEvent(members, 'groupChatDeleted', chatId);
        }
    });

    socket.on('leaveGroupChat', (chatId: number) => {
        if (isNaN(chatId) || dbCall.isChatPrivate(chatId) || !dbCall.isChatMember(name, chatId)) return;

        const rank = dbCall.getChatMemberRank(name, chatId);
        dbCall.removeChatMember(chatId, name);
        
        const members = dbCall.getChatMembers(chatId);
        let newOwner;

        if (members.length == 0) {
            dbCall.deleteChat(chatId);
            io.to(name).emit('chatMemberLeft', chatId, name);

            return;
        } else if (rank == 2) {
            newOwner = dbCall.transferChatOwnership(chatId);
        }
        
        broadcastEvent(members, 'chatMemberLeft', chatId, name, newOwner);
    });

    // ? anyone can add chat members
    socket.on('addChatMember', (chatId: number, other: string) => {
        if (isNaN(chatId) 
            || typeof other !== "string" 
            || dbCall.isChatPrivate(chatId)
            || !dbCall.isChatMember(name, chatId)
            || !dbCall.userExists(other)
            || dbCall.isChatMember(other, chatId)) return;

        dbCall.addChatMember(chatId, other);
        broadcastEvent(dbCall.getChatMembers(chatId), 'chatMemeberAdded', other);
    });

    // ? but only admins can remove them
    socket.on('removeChatMember', (chatId: number, other: string) => {
        if (isNaN(chatId) || typeof other !== "string" || !dbCall.isChatMember(other, chatId)) return;

        const rank = dbCall.getChatMemberRank(name, chatId);
        if (!rank || rank === 0) return; // ? socket is not a chat member or is not an admin
        
        const otherRank = dbCall.getChatMemberRank(other, chatId);
        if (!otherRank || otherRank === 2) return; // ? can't remove the chat owner

        dbCall.removeChatMember(chatId, other);

        // ? what chat, who got removed, who removed the member
        broadcastEvent(dbCall.getChatMembers(chatId), 'chatMemberRemoved', chatId, other, name);
    });

    socket.on('getChatData', (chatId: number, callback) => {
        if (isNaN(chatId) || typeof callback !== "function" || !dbCall.isChatMember(name, chatId)) return;

        const data = dbCall.getChatData(chatId);

        if (!data) return callback(null);

        callback(data);
    });

    // ? anyone can change group chat name
    socket.on('setChatName', (chatId: number, chatName: string|null) => {
        if (isNaN(chatId) || dbCall.isChatPrivate(chatId) || !dbCall.isChatMember(name, chatId)) return;

        if (typeof chatName !== "string") chatName = null;
        else chatName = chatName.slice(0, MAX_CHAT_NAME_LENGTH);

        dbCall.updateChatName(chatId, chatName);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatNameSet', chatId, chatName);
    });

    // ? anyone can change group chat photo
    socket.on('setChatCover', (chatId: number, chatCover: Blob|null) => {
        if (isNaN(chatId) || dbCall.isChatPrivate(chatId) || !dbCall.isChatMember(name, chatId)) return;

        let res;

        if (chatCover instanceof Blob) {
            if (chatCover.type.split('/')[0] == "image") return;

            res = dbCall.setChatCover(chatId, chatCover);
        } else {
            dbCall.removeChatCover(chatId);

            res = null;
        }

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatCoverSet', chatId, res);
    });

    // ? anyone can change nicknames
    socket.on('setChatNickname', (chatId: number, other: string, nickname: string|null) => {
        if (isNaN(chatId) 
            || typeof other !== "string" 
            || !dbCall.isChatMember(name, chatId) 
            || (name != other && !dbCall.isChatMember(other, chatId))) return;

        if (typeof nickname === "string") nickname = nickname.slice(0, MAX_NICKANAME_LENGTH);
        else nickname = null;

        dbCall.updateChatMemberNickname(chatId, other, nickname);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatNicknameSet', chatId, other, nickname);
    });

    socket.on('changeChatRank', (chatId: number, other: string) => {
        if (isNaN(chatId) 
            || typeof other !== "string" 
            || name == other) return;

        const userRank = dbCall.getChatMemberRank(name, chatId);
        if (!userRank || userRank === 0) return;

        const otherRank = dbCall.getChatMemberRank(other, chatId);
        if (!otherRank || otherRank === 2) return;

        const rank = +(otherRank !== 1);

        dbCall.setChatMemberRank(other, chatId, rank);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatRankChanged', chatId, other, rank);
    });

    // * can make it more efficient by not being lazy
    socket.on('changeUserBlockState', (other: string, callback) => {
        if (typeof other !== "string" || typeof callback !== "function" || !dbCall.userExists(other)) return;

        const blockList = dbCall.getUserBlockList(name)!.split(',');

        let state;
        if (blockList.includes(other)) {
            blockList.splice(blockList.indexOf(other), 1);
            state = false;
        }
        else {
            blockList.push(other);
            state = true;
        }

        dbCall.setUserBlockList(name, blockList.join(','));
        
        callback();

        // ? blocked by, block state
        io.to(other).emit('changedBlockState', name, state);
    });

    // ? if reactionId is undefined|null then the user's reaction to this message should be deleted (if it exists)
    // ? reactions encoding: usernameA:reactionId,usernameB:reactionId
    // * can make it more efficient by not being lazy
    socket.on('setMessageReaction', (messageId: number, reactionId: number) => {
        if (isNaN(messageId)) return;

        const data = dbCall.getMessageReactionsAndChatId(messageId);
        if (!data || !dbCall.isChatMember(name, data.chat_id)) return;

        const reactions = data.reactions.split(',');
        for (let i = 0; i < reactions.length; i++) {
            if (reactions[i].includes(name)) {
                if (typeof reactionId === "number" && reactionId <= DEBUG_HIGHEST_REACTION_INDEX) reactions[i] = `${name}:${reactionId}`;
                else reactions[i] = '';

                dbCall.setMessageReactions(messageId, reactions.join(','));

                broadcastEvent(dbCall.getChatMembers(data.chat_id), 'messageReactionSet', name, messageId, reactionId);

                return;
            }
        }

        if (typeof reactionId === "number" && reactionId <= DEBUG_HIGHEST_REACTION_INDEX) return;

        reactions.push(`${name}:${reactionId}`);
        dbCall.setMessageReactions(messageId, reactions.join(','));
        broadcastEvent(dbCall.getChatMembers(data.chat_id), 'messageReactionSet', name, messageId, reactionId);
    });
});