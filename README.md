# SvelteKit Chat App
A simple chat app made with SvelteKit, Lucia, Socket.io and better-sqlite3

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

### Notes
- When running in preview mode, you'll get an error that says that SvelteKit couldn't resolve an url ("/api/attachments"), it's caused by using node's fetch instead of SvelteKit's. To fix it, implement a work-around using form actions or do some other shenanigans idk. Too lazy to fix it. The app works 100% in dev though.

The app is fully functional, I probably won't finish the todo list bc I got bored
