export interface User{
    _id: string
    id: string
    name: string
    email: string
    color: string
    avatar?: string
}


export interface Card {
    _id: string
    title: string
    description: string
    order:number
    label?: 'bug' | 'feature' | 'improvement' | 'task' | null
    assignee?: User |null
    createAt: string
}


export interface Column {
    _id: string
    title: string
    order: number
    cards: Card[]
}

export interface Board {
    _id: string
    name: string
    description: string
    owner: User
    members: User[]
    columns: Column[]
    inviteCode: string
    createAt: string 
    updateAt: string

}

export interface AuthResponse {
    token: string
    user: User
}