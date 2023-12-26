import { env } from "$env/dynamic/private";
import { DATABASE_DIRECTORY } from "$env/static/private";
import Database from "better-sqlite3";
import fs from "fs";

const attachmentsPath = `${DATABASE_DIRECTORY}/attachments`;
const db = Database(`${DATABASE_DIRECTORY}/database.db`);

const getAttachmentTypeQuery = db.prepare("SELECT type FROM attachment WHERE id = ?").pluck(true);
const insertAvatarStmnt = db.prepare("INSERT INTO attachment VALUES(NULL, NULL, ?)");
const setUserAvatarStmnt = db.prepare("UPDATE user SET avatar_id = ? WHERE username = ?");

const getAttachmentData = db.prepare("SELECT chat_id, type FROM attachment WHERE id = ?");
const chatMemberExistsQuery = db.prepare("SELECT 1 FROM chat_member WHERE username = ? AND chat_id = ?").pluck(true);


const setUsernameStmnt = db.prepare("UPDATE user SET username = ? WHERE username = ?");
const getKeyByUsername = db.prepare("SELECT * FROM user_key WHERE id = ?");
const deleteKeyStmnt = db.prepare("DELETE FROM user_key WHERE id = ?");
const insertKeyStmnt = db.prepare("INSERT INTO user_key VALUES(?, ?, ?)");

export const dbCall = {
    getAttachment(id: number) {
        return fs.readFileSync(`${attachmentsPath}/${id}`);
    },

    getAttachmentData(id: number) {
        return getAttachmentData.get(id) as { chat_id: number, type: string };
    },

    isChatMember(username: string, chatId: number) {
        return chatMemberExistsQuery.get(username, chatId) == 1;
    },

    async setUserAvatar(username: string, avatar: Blob|null) {
        if (!avatar) return setUserAvatarStmnt.run(null, username);
        
        if (avatar.type.split('/')[0] != "image") return;

        const id = insertAvatarStmnt.run(avatar.type).lastInsertRowid as number;
        fs.writeFileSync(`${attachmentsPath}/${id}`, Buffer.from(await avatar.arrayBuffer()));

        setUserAvatarStmnt.run(id, username);
        return id;
    },

    changeUsername(username: string, newUsername: string) {
        setUsernameStmnt.run(newUsername, username);
        
        const key = getKeyByUsername.get(`username:${username}`) as { user_id: string, id: string, hashed_password: string|null }|undefined;
        if (!key) return;

        deleteKeyStmnt.run(key.id);
        insertKeyStmnt.run(`username:${newUsername}`, key.user_id, key.hashed_password);
    }
}

export { db as database } 