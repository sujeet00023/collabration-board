import {useEffect, useState, useCallback} from 'react'
import { getSocket } from '@/lib/socket'

export interface ChatMessage {
    id: string
    userId: string
    name: string
    color: string
    text: string
    timestamp: string

}


export function useChat(boardId: string){
    const [message,setMessage] = useState<ChatMessage[]>([])

    useEffect(() =>{
        const socket = getSocket()

        socket.on('chat:message', (msg: ChatMessage) => {
            setMessage(prev => [...prev, msg])
        })

        return () => {
            socket.off('chat: message')
        }
        
    }, [boardId])

    const sendMessage = useCallback((text: string) =>{
        if (!text.trim()) return
        getSocket().emit('chat: message', {boardId, text })
    }, [boardId])

    return { message, sendMessage }
}