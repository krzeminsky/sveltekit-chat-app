/// <reference types="lucia" />
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
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
