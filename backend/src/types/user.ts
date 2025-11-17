export interface User {
    id: number
    username: string
    password: string
}

export interface UserWithoutPassword {
    id: number
    username: string
}