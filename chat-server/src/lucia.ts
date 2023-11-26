import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { lucia } from "lucia";
import { db } from "./database.js";

export const auth = lucia({
    adapter: betterSqlite3(db, {
        user: "user",
        key: "user_key",
        session: "user_session"
    }),

    env: process.env.NODE_ENV === "development"? "DEV" : "PROD",

	getUserAttributes: (data) => {
		return {
			username: data.username,
            blockList: data.block_List,
            avatarId: data.avatar_id
		};
	}
})