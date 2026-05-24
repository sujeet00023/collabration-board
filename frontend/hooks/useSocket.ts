import { useEffect, useRef } from 'react'
import { getSocket } from '../lib/socket'
import { useBoardStore } from '../store/boardStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Card, Column } from '../types'

interface OnlineUser {
  userId: string
  name: string
  color: string
  socketId: string
}

export function useSocket(boardId: string) {
  const { user } = useAuthStore()
  const {
    setOnlineUsers,
    applyCardMoved,
    applyCardCreated,
    applyCardUpdated,
    applyCardDeleted,
    applyColumnCreated,
    applyColumnDeleted,
  } = useBoardStore()

  const joinedRef = useRef(false)

  useEffect(() => {
    if (!user || !boardId || joinedRef.current) return
    joinedRef.current = true

    const socket = getSocket()
    const currentUserId = user.id  // captured here — user is guaranteed non-null in this block

    socket.emit('board:join', { boardId })

    // ── Presence ─────────────────────────────────────────────
    function onRoomMembers({ members }: { members: OnlineUser[] }) {
      setOnlineUsers(members)
    }

    function onUserJoined(data: OnlineUser & { onlineCount: number }) {
      if (data.userId !== currentUserId) {
        toast(`${data.name} joined`, { icon: '👋', duration: 2000 })
      }
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.socketId === data.socketId)
        if (exists) return prev
        return [...prev, {
          userId: data.userId,
          name: data.name,
          color: data.color,
          socketId: data.socketId,
        }]
      })
    }

    function onUserLeft(data: { userId: string; name: string; socketId: string }) {
      if (data.userId !== currentUserId) {
        toast(`${data.name} left`, { duration: 1500 })
      }
      setOnlineUsers(prev => prev.filter(u => u.socketId !== data.socketId))
    }

    // ── Card events ───────────────────────────────────────────
    function onCardMoved(data: {
      cardId: string; fromColumnId: string; toColumnId: string; newOrder: number
    }) {
      applyCardMoved(data.cardId, data.fromColumnId, data.toColumnId, data.newOrder)
    }

    function onCardCreated(data: { columnId: string; card: Card }) {
      applyCardCreated(data.columnId, data.card)
    }

    function onCardUpdated(data: { columnId: string; cardId: string; changes: Partial<Card> }) {
      applyCardUpdated(data.columnId, data.cardId, data.changes)
    }

    function onCardDeleted(data: { columnId: string; cardId: string }) {
      applyCardDeleted(data.columnId, data.cardId)
    }

    // ── Column events ─────────────────────────────────────────
    function onColumnCreated(data: { column: Column }) {
      applyColumnCreated(data.column)
    }

    function onColumnDeleted(data: { columnId: string }) {
      applyColumnDeleted(data.columnId)
    }

    function onError({ message }: { message: string }) {
      toast.error(message)
    }

    socket.on('room:members',   onRoomMembers)
    socket.on('user:joined',    onUserJoined)
    socket.on('user:left',      onUserLeft)
    socket.on('card:moved',     onCardMoved)
    socket.on('card:created',   onCardCreated)
    socket.on('card:updated',   onCardUpdated)
    socket.on('card:deleted',   onCardDeleted)
    socket.on('column:created', onColumnCreated)
    socket.on('column:deleted', onColumnDeleted)
    socket.on('error',          onError)

    // NOTE: chat:message is intentionally NOT handled here
    // It is handled exclusively in useChat.ts to avoid listener conflicts

    return () => {
      socket.emit('board:leave', { boardId })
      socket.off('room:members',   onRoomMembers)
      socket.off('user:joined',    onUserJoined)
      socket.off('user:left',      onUserLeft)
      socket.off('card:moved',     onCardMoved)
      socket.off('card:created',   onCardCreated)
      socket.off('card:updated',   onCardUpdated)
      socket.off('card:deleted',   onCardDeleted)
      socket.off('column:created', onColumnCreated)
      socket.off('column:deleted', onColumnDeleted)
      socket.off('error',          onError)
      joinedRef.current = false
    }
  }, [boardId, user])
}