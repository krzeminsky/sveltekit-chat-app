/// <reference types="lucia" />

import type { Session } from "lucia";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session|null;
		}
		// interface PageData {}
		// interface Platform {}
	}

	namespace Lucia {
		type Auth = import("$lib/server/auth/lucia").Auth;
		type DatabaseUserAttributes = {
			username: string,
			block_list: string,
			avatar_id: number|null
		};
		type DatabaseSessionAttributes = {};
	}
}

export {};
