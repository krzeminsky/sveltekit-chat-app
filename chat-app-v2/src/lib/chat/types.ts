export type Chat = {
    id: number;
    private: number;
    name: string|null;
    cover_id: number|null
}

export type ChatMember = {
    id: number;
    username: string;
    chat_id: number;
    rank: number;
    nickname: string|null
}

export type ChatData = {
    chat: Chat;
    members: ChatMember[];
}

export type Message = {
    id: number;
    chat_id: number;
    username: string;
    content: string;
    is_attachment: number;
    timestamp: number;
    reactions: string;
}

export type SearchResult = {
    users: {
        username: string,
        avatar_id: number|null
    }[],

    chats?: {
        id: number,
        name: string,
        cover_id: number|null
    }[]
}