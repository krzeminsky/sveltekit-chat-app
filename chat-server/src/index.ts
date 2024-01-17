import polka from "polka";
import { Server } from "socket.io";
import { auth } from "./lucia.js";
import { Chat, dbCall } from "./database.js";

const port = 3000;
const { server } = polka().listen(port);

console.log(`Listening on port ${port}!`);

const io = new Server(server, {
    cors: {
        origin: "https://localhost:5173",
        methods: ["GET", "POST"]
    },

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
// TODO: add system messages like: x removed y from group chat
// ! usernames cannot contain: , :

function broadcastEvent(targets: string[], eventName: string, ...args: any) {
    for (const t of targets) io.to(t).emit(eventName, ...args);
}

io.use(async (socket, next) => {
    try {
        const session = await auth.validateSession(socket.handshake.auth.sessionId);

        socket.data.name = session.user.username;
        socket.join(socket.data.name);
        console.log(`Socket connected: ${socket.data.name}`);
    
        return next();
    } catch {
        console.log('rejected connection');
        return next(Error("Unauthorized"));
    }
});

io.on('connection', socket => {
    const name = socket.data.name;

    socket.emit('connected', dbCall.getLatestChatMessages(name));

    socket.on('search', (search: string, includeChats: boolean, callback) => {
        if (typeof search !== "string" || typeof includeChats !== "boolean" || typeof callback !== "function" || search.length <= 0 || search.length > 32) return;

        callback(dbCall.searchChats(name, search.toLowerCase(), includeChats));
    });

    socket.on('getUserAvatar', (other: string, callback) => {
        if (!other || typeof other !== "string" || typeof callback !== "function") return;

        const avatarId = dbCall.getUserAvatarId(other);
        if (!avatarId) return callback(avatarId);

        const data = dbCall.getAttachmentData(avatarId);
        if (!data) return callback(null);

        const buffer = dbCall.getAttachment(avatarId);

        callback({ avatarId, buffer, type: data.type });
    });

    socket.on('sendMessage', async (target: number|string, content: string|{ buffer: Buffer, type: string, name: string }) => {      
        if (!target || !content) return;

        let chatId: number;
        if (typeof target === "number") {
            if (!dbCall.isChatMember(name, target)) return console.log('user is not a member of this chat');

            // TODO: IMPLEMENT USER BLOCK LIST HERE IF THE CHAT IS PRIVATE

            chatId = target;
        } else if (typeof target === "string") {
            const otherBlockList = dbCall.getUserBlockList(target);
            if (typeof otherBlockList === "undefined" || otherBlockList.includes(name)) return console.log('user blocked');

            chatId = dbCall.getPrivateChatId(name, target)??dbCall.createChat([name, target]);
        } else return;

        const isAttachment = typeof content !== "string";

        try {
            const message = dbCall.insertMessage(
                name, 
                isAttachment? (await dbCall.insertAttachment(chatId, content.buffer, content.type, content.name )).toString() : content, 
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
        else if (data.chat_id && !dbCall.isChatMember(name, data.chat_id)) return callback(null);

        const buffer = dbCall.getAttachment(attachmentId);

        callback({ buffer, type: data.type, name: data.name });
    });

    // ? call callback on success
    socket.on('deleteMessage', (messageId: number) => {
        if (isNaN(messageId)) return;

        const owner = dbCall.getMessageOwner(messageId);
        if (!owner) return;

        if (name != owner.username) return;

        dbCall.deleteMessage(messageId);

        broadcastEvent(dbCall.getChatMembers(owner.chat_id), 'messageDeleted', messageId, owner.chat_id);
    });

    socket.on('createGroupChat', (otherMembers: string[]) => {
        if (!Array.isArray(otherMembers) || !otherMembers.every(m => typeof m === "string")) return;

        otherMembers = otherMembers.filter(m => dbCall.userExists(m));
        if (otherMembers.length < 2) return;

        const targets = [name, ...otherMembers];
        const id = dbCall.createChat(targets);

        const data = dbCall.getChatData(id);

        const systemMessage = dbCall.insertMessage("", `${name} created the group chat`, id, 0);

        // ? first member of targets is the creator
        broadcastEvent(targets, 'groupChatCreated', data, systemMessage); // ? chatId, members
    });

    // ? if its a group chat and the socket is the creator of the group chat - delete the chat, if its a private convo - update the break point for the socket
    socket.on('deleteChat', (chatId: number) => {
        if (isNaN(chatId)) return;

        if (dbCall.isChatPrivate(chatId)) {
            dbCall.updateChatBreakPoint(name, chatId);
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
        io.to(name).emit('groupChatDeleted', chatId);
        
        const members = dbCall.getChatMembers(chatId);
        let newOwner;

        if (members.length == 0) {
            return dbCall.deleteChat(chatId);;
        } else if (rank == 2) {
            newOwner = dbCall.transferChatOwnership(chatId);
        }
        
        const systemMessage = dbCall.insertMessage("", `${members} left the group chat`, chatId, 0);

        broadcastEvent(members, 'chatMemberLeft', chatId, name, newOwner, systemMessage);
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
        
        const systemMessage = dbCall.insertMessage("", `${name} added ${other} to the group chat`, chatId, 0);

        // ? chatId, who added, who got added
        broadcastEvent(dbCall.getChatMembers(chatId), 'chatMemeberAdded', chatId, other, systemMessage);
    });

    // ? but only admins can remove them
    socket.on('removeChatMember', (chatId: number, other: string) => {
        if (isNaN(chatId) || typeof other !== "string" || !dbCall.isChatMember(other, chatId)) return;

        const rank = dbCall.getChatMemberRank(name, chatId);
        if (!rank || rank === 0) return; // ? socket is not a chat member or is not an admin
        
        const otherRank = dbCall.getChatMemberRank(other, chatId);
        if (!otherRank || otherRank === 2) return; // ? can't remove the chat owner

        dbCall.removeChatMember(chatId, other);
        
        const systemMessage = dbCall.insertMessage("", `${name} removed ${other} from the group chat`, chatId, 0);

        io.to(other).emit('groupChatDeleted', chatId);
        // ? chatId, who removed, who got removed
        broadcastEvent(dbCall.getChatMembers(chatId), 'chatMemberRemoved', chatId, other, systemMessage);
    });

    socket.on('getChatData', (target: number|string, callback) => {        
        if (!target || typeof callback !== "function") return;

        if (typeof target === "string") {
            const id = dbCall.getPrivateChatId(name, target);
            if (!id) return callback(null);

            const data = dbCall.getChatData(id);
            callback(data);
        } else {
            callback(dbCall.getChatData(target));
        }
    })

    // ? anyone can change group chat name
    socket.on('setChatName', (chatId: number, chatName: string|null) => {
        if (isNaN(chatId) || dbCall.isChatPrivate(chatId) || !dbCall.isChatMember(name, chatId)) return;

        if (typeof chatName !== "string") chatName = null;
        else chatName = chatName.slice(0, MAX_CHAT_NAME_LENGTH);

        dbCall.updateChatName(chatId, chatName);
        
        const systemMessage = dbCall.insertMessage("", !chatName? `${name} removed the chat name` : `${name} set the chat name to ${chatName}`, chatId, 0);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatNameSet', chatId, chatName, systemMessage);
    });

    // ? anyone can change group chat photo
    socket.on('setChatCover', async (chatId: number, chatCover: { buffer: Buffer, type: string, name: string }|null) => {
        if (isNaN(chatId) || dbCall.isChatPrivate(chatId) || !dbCall.isChatMember(name, chatId)) return;

        let coverId;

        if (chatCover) {
            if (chatCover.type.slice(0, 5) != "image") return;

            coverId = await dbCall.setChatCover(chatId, chatCover.buffer, chatCover.type, chatCover.name);
        } else {
            dbCall.removeChatCover(chatId);

            coverId = null;
        }

        const systemMessage = dbCall.insertMessage("", !chatCover? `${name} removed the chat cover` : `${name} changed the chat cover`, chatId, 0);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatCoverSet', chatId, coverId, systemMessage);
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
        
        const systemMessage = dbCall.insertMessage("", !nickname? `${name} removed ${other}'s nickname` : `${name} set ${other}'s nickname to ${nickname}`, chatId, 0);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatNicknameSet', chatId, other, nickname, systemMessage);
    });

    socket.on('changeChatMemberRank', (chatId: number, other: string) => {
        if (isNaN(chatId) 
            || typeof other !== "string" 
            || name == other) return;

        const userRank = dbCall.getChatMemberRank(name, chatId);
        if (!userRank || userRank === 0) return;

        const otherRank = dbCall.getChatMemberRank(other, chatId);
        if (!otherRank || otherRank === 2) return;

        const rank = +(otherRank !== 1);

        dbCall.setChatMemberRank(other, chatId, rank);
        
        const systemMessage = dbCall.insertMessage("", rank == 0? `${name} demoted ${other}` : `${name} promoted ${other}`, chatId, 0);

        broadcastEvent(dbCall.getChatMembers(chatId), 'chatMemberRankChanged', chatId, other, rank, systemMessage);
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
        io.to(other).emit('userBlockStateChanged', name, state);
    });

    // ? if reactionId is undefined|null then the user's reaction to this message should be deleted (if it exists)
    // ? reactions encoding: usernameA:reactionId,usernameB:reactionId
    // * can make it more efficient by not being lazy
    socket.on('setMessageReaction', (messageId: number, reactionId: number|null) => {
        if (isNaN(messageId)) return;

        const data = dbCall.getMessageReactionsAndChatId(messageId);
        if (!data || !dbCall.isChatMember(name, data.chat_id)) return;

        const reactions = data.reactions.split(',');
        for (let i = 0; i < reactions.length; i++) {
            if (reactions[i].includes(name)) {
                if (typeof reactionId === "number" && reactionId > 0 && reactionId <= DEBUG_HIGHEST_REACTION_INDEX) reactions[i] = `${name}:${reactionId}`;
                else reactions[i] = '';

                const res = reactions.join(',');
                dbCall.setMessageReactions(messageId, res);

                broadcastEvent(dbCall.getChatMembers(data.chat_id), 'messageReactionSet', data.chat_id, messageId, res);

                return;
            }
        }

        if (typeof reactionId !== "number" || reactionId < 0 || reactionId > DEBUG_HIGHEST_REACTION_INDEX) return;

        reactions.push(`${name}:${reactionId}`);
        const res = reactions.join(',')
        dbCall.setMessageReactions(messageId, res);
        broadcastEvent(dbCall.getChatMembers(data.chat_id), 'messageReactionsSet', data.chat_id, messageId, res);
    });

    socket.on('disconnect', () => {
        console.log(`${name} disconnected`);
    });
});