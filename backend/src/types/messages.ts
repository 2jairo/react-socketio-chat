export interface Message {
    id: number
    group_id: number
    user_id: number
    content: string
    created_at: Date
    updated_at?: Date
}


export interface MessageAttachment {
    id: number
    message_id: number
    file_name: string
    file_url: string
    file_type: string
}


export interface MessageWithAuthor extends Message {
    user_id: number
    username: string
}