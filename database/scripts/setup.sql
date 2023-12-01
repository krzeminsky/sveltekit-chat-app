CREATE TABLE user (
    id TEXT NOT NULL PRIMARY KEY,
    username TEXT NOT NULL,
    block_list TEXT NOT NULL,
    avatar_id INTEGER
);

CREATE TABLE user_key (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    hashed_password TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE user_session (
    id TEXT NOT NULL PRIMARY KEY,
    user_id TEXT NOT NULL,
    active_expires INTEGER NOT NULL,
    idle_expires INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE chat (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    private BIT NOT NULL,

    name TEXT,
    cover_id INTEGER
);

CREATE TABLE chat_member (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL ON DELETE CASCADE,
    chat_id INTEGER NOT NULL ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    breaK_point INTEGER NOT NULL,
    nickname TEXT,

    FOREIGN KEY (username) REFERENCES user(username),
    FOREIGN KEY (chat_id) REFERENCES chat(id)
);

CREATE TABLE message (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    is_attachment BIT NOT NULL,
    timestamp INTEGER NOT NULL,
    reactions TEXT NOT NULL,

    FOREIGN KEY (chat_id) REFERENCES chat(id),
    FOREIGN KEY (username) REFERENCES user(username)
);

CREATE TABLE attachment (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER,
    type TEXT NOT NULL,
);