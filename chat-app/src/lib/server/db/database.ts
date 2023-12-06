import { env } from "$env/dynamic/private";
import Database from "better-sqlite3";

const db = Database(env.DATABASE_PATH);

export { db as database } 