import { env } from "$env/dynamic/private";
import { DATABASE_DIRECTORY } from "$env/static/private";
import Database from "better-sqlite3";
import fs from "fs";

const db = Database(`${DATABASE_DIRECTORY}/database.db`);

const insertAttachmentStmnt = db.prepare("INSERT INTO attachment VALUES(NULL, ?, ?)");
const updateUserAvatarStmnt = db.prepare("UPDATE user SET avatar_id = ? WHERE username = ?")

export const dbCall = {
    async updateAvatar(username: string, attachment: Blob) {
        if (!(attachment instanceof Blob)) throw Error;
        
        console.log(attachment);
        const id = insertAttachmentStmnt.run(null, attachment.type).lastInsertRowid;
    
        fs.writeFileSync(`${env.DATABASE_DIRECTORY}/attachments/${id}`, Buffer.from(await attachment.arrayBuffer()));

        updateUserAvatarStmnt.run(id, username);
    },
}

export { db as database } 