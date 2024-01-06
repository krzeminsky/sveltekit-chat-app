export type Chat = {
    id: number;
    private: number;
    name: string|null;
    cover_id: number|null
}

export type ChatMember = {
    username: string;
    nickname: string|null;
    rank: number;
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
    users: string[],

    chats?: {
        id: number,
        name: string,
        cover_id: number|null
    }[]
}