export type UserStatus = 'finding' | 'chatting'

export interface User {
    id: string
    username: string
    status: UserStatus
    chat_id: string | null
    created_at: string
}

export interface Chat {
    id: string
    created_at: string
}

export interface Message {
    id: string
    chat_id: string
    sender_id: string
    content: string
    created_at: string
}

export interface ChatWithUsers extends Chat {
    users: User[]
    messages: Message[]
}

export interface MatchmakingState {
    status: 'idle' | 'finding' | 'chatting'
    currentChat?: ChatWithUsers
    currentUser?: User
}
