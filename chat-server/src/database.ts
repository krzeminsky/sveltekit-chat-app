import Database from "better-sqlite3";
import fs from "fs";

const dataPath = '../../database';
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
    reactions?: string
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
    WHERE chat_id = ?
    ORDER BY id DESC
    LIMIT 10
    OFFSET ?
`);

const getLatestChatMessagesTransaction = db.transaction((username: string) => {
    const chats = getLatestChatsQuery.all(username) as Chat[];

    const res: { chat: Chat, messages: Message[] }[] = [];
    for (const c of chats) {
        res.push({ chat: c, messages: getChatMessagesQuery.all(c.id, 0) as Message[] });
    }

    return res;
});

const insertChatMemberStmnt = db.prepare("INSERT INTO chat_member VALUES(NULL, ?, ?, ?, 0, NULL)");

const insertChatMembersTransaction = db.transaction((chatId: number, members: string[]) => {
    for (const m of members) insertChatMemberStmnt.run(m, chatId, 0);
})

const insertChatStmnt = db.prepare("INSERT INTO chat VALUES(NULL, ?, NULL, NULL, NULL)"); 

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

const insertMessageStmnt = db.prepare("INSERT INTO message VALUES(NULL, ?, ?, ?, ?, ?, NULL)");

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
const getChatAttachmentIdsQuery = db.prepare("SELECT id FROM attachment WHERE chat_id = ?").pluck(true);


const deleteChatTransaction = db.transaction((chatId: number) => {
    const attachmentsIds = getChatAttachmentIdsQuery.all(chatId);

    for (const id of attachmentsIds) {
        fs.unlinkSync(`${attachmentsPath}/${id}`);
    }

    deleteChatStmnt.run(chatId);
});

const getChatMembersDataQuery = db.prepare("SELECT username, rank, nickname FROM chat_member WHERE chat_id = ?");

const getChatDataTransaction = db.transaction((chatId: number) => {
    const chat = getChatQuery.get(chatId) as Chat|undefined;

    if (!chat) return undefined;

    const members = getChatMembersDataQuery.all(chatId) as { username: string, nickname?: string, rank: number}[];

    return { chat, members };
});

const updateChatNameStmnt = db.prepare("UPDATE chat SET name = ? WHERE id = ?");

const updateChatCoverIdStmnt = db.prepare("UPDATE chat SET cover_id = ? WHERE id = ?");

const getChatCoverIdQuery = db.prepare("SELECT cover_id FROM chat WHERE id = ?").pluck(true);

const updateChatMemberNicknameStmnt = db.prepare("UPDATE chat_member SET nickname = ? WHERE chat_id = ? AND username = ?");

const removeChatMemberStmnt = db.prepare("DELETE FROM chat_member WHERE chat_id = ? AND username = ?");

const getOldestChatMemberQuery = db.prepare("SELECT username FROM chat_member WHERE chat_id = ? ORDER BY id DESC LIMIT 1").pluck(true);
const updateChatMemberRankStmnt = db.prepare("UPDATE chat_member SET rank = ? WHERE chat_id = ? AND username = ?");

const dbCall = {
    userExists(username: string) {
        return userExistsQuery.get(username) == 1;
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

    async insertAttachment(chatId: number, attachment: Blob) {
        if (!(attachment instanceof Blob)) throw Error;
        
        const id = insertAttachmentStmnt.run(chatId, attachment.type).lastInsertRowid;

        fs.writeFileSync(`${attachmentsPath}/${id}`, Buffer.from(await attachment.arrayBuffer()));

        return id;
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
        const nextOwner = getOldestChatMemberQuery.get(chatId) as string|undefined;

        updateChatMemberRankStmnt.run(2, chatId, nextOwner);

        return nextOwner;
    }
}

export { db, dbCall }