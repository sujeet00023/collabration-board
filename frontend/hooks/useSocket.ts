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


/**
 * Connects to a board room via Socket.io and wires up
 * all real-time events to the board store.
 *
 * Usage: call this once inside the board page.
 */
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
    socket.emit('board:join', { boardId })

    // ── Presence ────────────────────────────────────────────
    socket.on('room:members', ({ members }: { members: OnlineUser[] }) => {
      setOnlineUsers(members)
    })

    socket.on('user:joined', (data: OnlineUser & { onlineCount: number }) => {
      if (data.userId !== user.id) {
        toast(`${data.name} joined`, { icon: '👋', duration: 2000 })
      }
      setOnlineUsers(prev => {
        const exists = prev.some(u => u.socketId === data.socketId)
        if (exists) return prev
        return [...prev, { userId: data.userId, name: data.name, color: data.color, socketId: data.socketId }]
      })
    })

    socket.on('user:left', (data: { userId: string; name: string; socketId: string }) => {
      if (data.userId !== user.id) {
        toast(`${data.name} left`, { duration: 1500 })
      }
      setOnlineUsers(prev => prev.filter(u => u.socketId !== data.socketId))
    })

    // ── Card events ─────────────────────────────────────────
    socket.on('card:moved', (data: { cardId: string; fromColumnId: string; toColumnId: string; newOrder: number }) => {
      applyCardMoved(data.cardId, data.fromColumnId, data.toColumnId, data.newOrder)
    })

    socket.on('card:created', (data: { columnId: string; card: Card }) => {
      applyCardCreated(data.columnId, data.card)
    })

    socket.on('card:updated', (data: { columnId: string; cardId: string; changes: Partial<Card> }) => {
      applyCardUpdated(data.columnId, data.cardId, data.changes)
    })

    socket.on('card:deleted', (data: { columnId: string; cardId: string }) => {
      applyCardDeleted(data.columnId, data.cardId)
    })

    // ── Column events ────────────────────────────────────────
    socket.on('column:created', (data: { column: Column }) => {
      applyColumnCreated(data.column)
    })

    socket.on('column:deleted', (data: { columnId: string }) => {
      applyColumnDeleted(data.columnId)
    })

    socket.on('error', ({ message }: { message: string }) => {
      toast.error(message)
    })

    return () => {
      socket.emit('board:leave', { boardId })
      socket.off('room:members')
      socket.off('user:joined')
      socket.off('user:left')
      socket.off('card:moved')
      socket.off('card:created')
      socket.off('card:updated')
      socket.off('card:deleted')
      socket.off('column:created')
      socket.off('column:deleted')
      socket.off('error')
      joinedRef.current = false
    }
  }, [boardId, user])
}
