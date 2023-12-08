import { betterSqlite3 } from "@lucia-auth/adapter-sqlite";
import { lucia } from "lucia";
import { database } from "../db/database";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";

export const auth = lucia({
    adapter: betterSqlite3(database, {
        user: "user",
        key: "user_key",
        session: "user_session"
    }),

    env: dev ? "DEV" : "PROD",
    
    middleware: sveltekit(),

	getUserAttributes: (data) => {
		return {
			username: data.username,
            blockList: data.block_list,
            avatarId: data.avatar_id
		};
	}
})
 
export type Auth = typeof auth;