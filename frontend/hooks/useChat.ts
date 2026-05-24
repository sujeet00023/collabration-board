import { useEffect, useRef, useState, useCallback } from 'react'
import { getSocket } from '../lib/socket'

export interface ChatMessage {
  id: string
  userId: string
  name: string
  color: string
  text: string
  timestamp: string
}

export function useChat(boardId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Use a ref so the listener always has the latest boardId
  const boardIdRef = useRef(boardId)
  boardIdRef.current = boardId

  useEffect(() => {
    if (!boardId) return

    const socket = getSocket()

    // Named function so we can remove exactly this listener — not all chat:message listeners
    function onChatMessage(msg: ChatMessage) {
      setMessages(prev => [...prev, msg])
    }

    // socket.on adds a NEW listener each call — use socket.off(event, fn) to remove only this one
    socket.on('chat:message', onChatMessage)

    return () => {
      // Remove ONLY this specific listener, not all chat:message listeners
      socket.off('chat:message', onChatMessage)
    }
  }, [boardId])

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return
      const socket = getSocket()

      // Make sure socket is connected before emitting
      if (!socket.connected) {
        console.warn('[chat] socket not connected, cannot send message')
        return
      }

      socket.emit('chat:message', { boardId: boardIdRef.current, text: text.trim() })
    },
    [] // no deps needed — boardIdRef always has latest value
  )

  return { messages, sendMessage }
}