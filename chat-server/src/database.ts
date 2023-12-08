import Database from "better-sqlite3";
import fs from "fs";
import { compareTwoStrings } from "string-similarity";

const dataPath = '../database';
const attachmentsPath = `${dataPath}/attachments`;

const db = Database(`${dataPath}/database.db`);
db.defaultSafeIntegers(false);

export type Chat = {
    id: number,
    private: number,
    name?: string,
    cover_id?: number
}

export type Message = {
    id: number,
    chat_id: number,
    username: string,
    content: string,
    is_attachment: number,
    timestamp: number,
    reactions: string
}

export type ChatMember = {
    username: string,
    nickname?: string,
    rank: number,
    avatar_id: number|null
}

export type SearchResult = {
    users: {
        username: string,
        avatar_id: number|null
    }[],

    chats?: {
        id: number,
        name: string,
        cover_id: number|null
    }[]
}

const userExistsQuery = db.prepare("SELECT 1 FROM user WHERE username = ?");

const getLatestChatsQuery = db.prepare(`
    SELECT c.*
    FROM chat AS c
    JOIN chat_member AS cm
    ON cm.chat_id = c.id AND cm.username = ?
    JOIN message AS m
    ON m.chat_id = c.id
    ORDER BY m.id DESC
    LIMIT 10
`);

const getChatQuery = db.prepare('SELECT * FROM chat WHERE id = ?');

const getChatMembersQuery = db.prepare('SELECT username FROM chat_member WHERE chat_id = ?').pluck(true);

const getChatMessagesQuery = db.prepare(`
    SELECT *
    FROM message
    WHERE chat_id = ? AND id > ?
    ORDER BY id DESC
    LIMIT 10
    OFFSET ?
`);

const getChatBreakPointQuery = db.prepare("SELECT break_point FROM chat_member WHERE chat_id = ? AND username = ?").pluck(true);

const getLatestChatMessagesTransaction = db.transaction((username: string) => {
    const chats = getLatestChatsQuery.all(username) as Chat[];

    const res: { chat: Chat, members: ChatMember[], messages: Message[] }[] = [];
    for (const c of chats) {
        res.push({ chat: c, members: getChatMembersDataQuery.all(c.id) as ChatMember[], messages: getChatMessagesQuery.all(c.id, getChatBreakPointQuery.get(c.id, username), 0) as Message[] });
    }

    return res;
});

const insertChatMemberStmnt = db.prepare("INSERT INTO chat_member VALUES(NULL, ?, ?, ?, 0, NULL)");

const insertChatMembersTransaction = db.transaction((chatId: number, members: string[]) => {
    for (const m of members) insertChatMemberStmnt.run(m, chatId, 0);
})

const insertChatStmnt = db.prepare("INSERT INTO chat VALUES(NULL, ?, NULL, NULL)"); 

const insertChatTransaction = db.transaction((members: string[]) => {
    const chatId = insertChatStmnt.run(+(members.length == 2)).lastInsertRowid as number;

    if (members.length > 2) {
        insertChatMemberStmnt.run(members[0], chatId, 2); 
        members = members.slice(1);
    } 

    insertChatMembersTransaction(chatId, members);

    return chatId;
});

const isChatMemberQuery = db.prepare("SELECT 1 FROM chat_member WHERE username = ? AND chat_id = ?");

const insertMessageStmnt = db.prepare(`INSERT INTO message VALUES(NULL, ?, ?, ?, ?, ?, '')`);

const insertAttachmentStmnt = db.prepare("INSERT INTO attachment VALUES(NULL, ?, ?)");

const getMessageOwnerQuery = db.prepare("SELECT username, chat_id FROM message WHERE id = ?");

const deleteMessageStmnt = db.prepare("DELETE FROM message WHERE id = ?");

const getChatMemberRankQuery = db.prepare("SELECT rank FROM chat_member WHERE username = ? AND chat_id = ?").pluck(true);

const getPrivateChatIdQuery = db.prepare(`
    SELECT c.id
    FROM chat AS c
    JOIN chat_member AS cm1 ON cm1.username = ? AND cm1.chat_id = c.id
    JOIN chat_member AS cm2 ON cm2.username = ? AND cm2.chat_id = c.id
    WHERE c.private = 1
`).pluck(true);

const isChatPrivateQuery = db.prepare("SELECT private FROM chat WHERE id = ?").pluck(true);

const updateChatBreakPointStmnt = db.prepare("UPDATE chat_member SET break_point = ? WHERE username = ? AND chat_id = ?");

const getLastChatMessageIdQuery = db.prepare("SELECT id FROM message WHERE chat_id = ? ORDER BY id DESC LIMIT 1").pluck(true);

const deleteChatStmnt = db.prepare("DELETE FROM chat WHERE id = ?");

const getChatMembersDataQuery = db.prepare("SELECT cm.username, cm.rank, cm.nickname, u.avatar_id FROM chat_member AS cm JOIN user AS u ON u.username = cm.username WHERE chat_id = ?");

const getChatDataTransaction = db.transaction((chatId: number) => {
    const chat = getChatQuery.get(chatId) as Chat|undefined;

    if (!chat) return undefined;

    const members = getChatMembersDataQuery.all(chatId) as ChatMember[];

    return { chat, members };
});

const updateChatNameStmnt = db.prepare("UPDATE chat SET name = ? WHERE id = ?");

const updateChatCoverIdStmnt = db.prepare("UPDATE chat SET cover_id = ? WHERE id = ?");

const getChatCoverIdQuery = db.prepare("SELECT cover_id FROM chat WHERE id = ?").pluck(true);

const updateChatMemberNicknameStmnt = db.prepare("UPDATE chat_member SET nickname = ? WHERE chat_id = ? AND username = ?");

const removeChatMemberStmnt = db.prepare("DELETE FROM chat_member WHERE chat_id = ? AND username = ?");

const getOldestChatMemberQuery = db.prepare("SELECT username FROM chat_member WHERE chat_id = ? ORDER BY id DESC LIMIT 1").pluck(true);

const updateChatMemberRankStmnt = db.prepare("UPDATE chat_member SET rank = ? WHERE chat_id = ? AND username = ?");

const getUserBlockListQuery = db.prepare("SELECT block_list FROM user WHERE username = ?").pluck(true);

const getAttachmentDataQuery = db.prepare("SELECT chat_id, type FROM attachment WHERE id = ?");

const setUserBlockListStmnt = db.prepare("UPDATE user SET block_list = ? WHERE username = ?");

const getMessageReactionsAndChatIdStmnt = db.prepare("SELECT chat_id, reactions FROM message WHERE id = ?");

const setMessageReactionsStmnt = db.prepare("UPDATE message SET reactions = ? WHERE id = ?");

const getChatAttachmentIdsQuery = db.prepare("SELECT id FROM attachment WHERE chat_id = ?").pluck(true);
const deleteAttachmentStmnt = db.prepare("DELETE FROM attachment WHERE id = ?");

const deleteChatTransaction = db.transaction((chatId: number) => {
    const attachmentsIds = getChatAttachmentIdsQuery.all(chatId);
    for (const id of attachmentsIds) {
        fs.unlinkSync(`${attachmentsPath}/${id}`);
        deleteAttachmentStmnt.run(id);
    }

    deleteChatStmnt.run(chatId);
});


const MAX_SEARCH_RESULTS = 5;
const searchUsersQuery = db.prepare(`SELECT username, avatar_id FROM user WHERE LOWER(username) LIKE ? LIMIT ${MAX_SEARCH_RESULTS}`);
const getUserGroupChatsByNameQuery = db.prepare(`
    SELECT c.id, c.cover_id, c.name FROM chat AS c 
    JOIN chat_member AS cm ON cm.id = c.id AND cm.username = ?
    WHERE c.name IS NOT NULL AND LOWER(c.name) LIKE ? LIMIT ?
`);

const getUserGroupChatsWithNoNameQuery = db.prepare(`
    SELECT c.id, c.cover_id, c.name FROM chat AS c
    JOIN chat_member AS cm ON cm.id = c.id AND cm.username = ?
    WHERE c.name IS NULL
`);

// ! I HAVE NO IDEA WHAT I'M DOING
const getSearchResultsTransaction = db.transaction((username: string, search: string) => {
    const searchParam = `${search}%`;
    const users = searchUsersQuery.all(searchParam) as { username: string, avatar_id: number|null }[];

    if (users.length < MAX_SEARCH_RESULTS) {
        const chats = getUserGroupChatsByNameQuery.all(searchParam, MAX_SEARCH_RESULTS - users.length) as { id: number, cover_id: number|null, name: string }[];
        let remaining = MAX_SEARCH_RESULTS - users.length - chats.length;

        if (remaining > 0) { // ? try to find chats by members' usernames
            const namelessChats = getUserGroupChatsWithNoNameQuery.all(username) as { id: number, cover_id: number|null, name: string }[];
            const compressedSearch = search.replace(/\s+/g, '');
            
            for (let c of namelessChats) {
                const members = getChatMembersQuery.all(c.id) as string[];
                
                const joinedMembers = members.join();

                if (compareTwoStrings(compressedSearch, joinedMembers) > 0.5) {
                    c.name = members.length > 3? `${members.join(', ')} and others` : members.join(', ');
                    chats.push(c);

                    remaining--;
                    if (remaining === 0) break;
                }
            }
        }

        return { users, chats } as SearchResult
    }

    return { users } as SearchResult
});

const dbCall = {   
    searchChats(username: string, search: string) {
        return getSearchResultsTransaction(username, search);
    },
    
    userExists(username: string) {
        return userExistsQuery.get(username) == 1;
    },

    getUserBlockList(username: string) {
        return getUserBlockListQuery.get(username) as string|undefined;
    },
    
    setUserBlockList(username: string, blockList: string) {
        setUserBlockListStmnt.run(blockList, username);
    },

    isChatMember(username: string, chatId: number) {
        return isChatMemberQuery.get(username, chatId) == 1;
    },

    isChatPrivate(chatId: number) {
        return isChatPrivateQuery.get(chatId) == 1;
    },
    
    getLatestChatMessages(username: string) {
        return getLatestChatMessagesTransaction(username);
    },

    getChatMemberBreakPoint(username: string, chatId: number) {
        return getChatBreakPointQuery.get(chatId, username) as number|undefined;
    },

    getChatMessages(chatId: number, offset: number, breakPoint = 0) {
        return getChatMessagesQuery.all(chatId, breakPoint, offset) as Message[];
    },

    getChatMembers(id: number) {
        return getChatMembersQuery.all(id) as string[];
    },

    removeChatMember(chatId: number, username: string) {
        removeChatMemberStmnt.run(chatId, username);
    },

    getPrivateChatId(usernameA: string, usernameB: string) {
        return getPrivateChatIdQuery.get(usernameA, usernameB) as number|undefined;
    },

    createChat(members: string[]) {
        return insertChatTransaction(members);
    },

    insertMessage(username: string, content: string, chatId: number, isAttachment: number) {
        const id = insertMessageStmnt.run(chatId, username, content, isAttachment, Date.now()).lastInsertRowid;

        const message = {
            id,
            chat_id: chatId,
            content,
            is_attachment: isAttachment,
            timestamp: Date.now(),
            username
        } as Message;

        return message;
    },

    async insertAttachment(chatId: number|null, attachment: Blob) {
        if (!(attachment instanceof Blob)) throw Error;
        
        const id = insertAttachmentStmnt.run(chatId, attachment.type).lastInsertRowid;

        fs.writeFileSync(`${attachmentsPath}/${id}`, Buffer.from(await attachment.arrayBuffer()));

        return id;
    },

    getAttachmentData(id: number) {
        return getAttachmentDataQuery.get(id) as { chat_id: number|null, type: string }|undefined;
    },

    getAttachment(id: number) {
        return fs.readFileSync(`${attachmentsPath}/${id}`);
    },

    getMessageOwner(id: number) {
        return getMessageOwnerQuery.get(id) as { username: string, chat_id: number } | undefined;
    },

    deleteMessage(id: number) {
        deleteMessageStmnt.run(id);
    },

    getChatMemberRank(username: string, chatId: number) {
        return getChatMemberRankQuery.get(username, chatId) as number|undefined;
    },

    setChatMemberRank(username: string, chatId: number, rank: number) {
        updateChatMemberRankStmnt.run(rank, chatId, username);
    },

    updateChatBreakPoint(username: string, chatId: number) {
        updateChatBreakPointStmnt.run(getLastChatMessageIdQuery.get(chatId), username, chatId);
    },

    deleteChat(chatId: number) {
        deleteChatTransaction(chatId);
    },

    getChatData(chatId: number) {
        return getChatDataTransaction(chatId);
    },

    updateChatName(chatId: number, name: string|null) {
        updateChatNameStmnt.run(name, chatId);
    },

    removeChatCover(chatId: number) {
        const coverId = getChatCoverIdQuery.get(chatId) as number|undefined;

        if (!coverId) return;

        fs.unlinkSync(`${attachmentsPath}/${coverId}`);

        updateChatCoverIdStmnt.run(null, chatId);
    },

    setChatCover(chatId: number, cover: Blob) {
        this.removeChatCover(chatId);

        const coverId = this.insertAttachment(chatId, cover);

        updateChatCoverIdStmnt.run(cover, chatId);

        return coverId;
    },

    updateChatMemberNickname(chatId: number, username: string, nickname: string|null) {
        updateChatMemberNicknameStmnt.run(nickname, chatId, username);
    },

    transferChatOwnership(chatId: number) {
        const nextOwner = getOldestChatMemberQuery.get(chatId) as string;

        this.setChatMemberRank(nextOwner, chatId, 2);

        return nextOwner;
    },

    addChatMember(chatId: number, username: string) {
        insertChatMemberStmnt.run(username, chatId, 0);
    },

    getMessageReactionsAndChatId(messageId: number) {
        return getMessageReactionsAndChatIdStmnt.get(messageId) as { chat_id: number, reactions: string }|undefined;
    },

    setMessageReactions(messageId: number, reactions: string) {
        setMessageReactionsStmnt.run(reactions, messageId);
    }
}

export { db, dbCall }