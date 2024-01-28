# SvelteKit Chat App
A simple chat app made with SvelteKit, Lucia, Socket.io and better-sqlite3

## Setup
- Create a database.db file in /database directory, then run the setup.sql script. 
- Create a /database/attachments directory.

## Features
- Real-time messaging using WebSockets
- Accounts
- Profile pictures
- DMs
- Attachments
- Group chats
- Group chat admins
- Nicknames

## TODO:
- Optimize
- Rate limiting using redis
- Message reactions
- Blocking users
- Loading more chats in the left panel

### Notes
- When running in preview mode, you'll get an error that says that SvelteKit couldn't resolve an url ("/api/attachments"), it's caused by using node's fetch instead of SvelteKit's. To fix it, implement a work-around using form actions or do some other shenanigans idk. Too lazy to fix it. The app works 100% in dev though.
- To run the app in preview mode, change the cors origin url in the chat-server/src/index.ts file to match the preview's server port.

The app is fully functional, I probably won't finish the todo list bc I got bored
