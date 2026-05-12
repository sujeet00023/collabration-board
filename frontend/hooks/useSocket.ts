import {useEffect, useRef} from 'react'
import { getSocket } from '@/lib/socket'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore  } from '@/store/authStore'
import toast  from 'react-hot-toast'
import { Card,Column} from '@/types'



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
    const {user} = useAuthStore()
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

    useEffect(() =>{
        if (!user || !boardId || joinedRef.current) return
        joinedRef.current = true

        const socket = getSocket()

        socket.emit('board:join', {boardId })

        socket.on('room:members', ({ members}: {members: OnlineUser[]}) =>{
            setOnlineUsers(members)

        })

        socket.on('user:joined', (data:OnlineUser & { onlineCount:number }) =>{
            if (data.userId ! == user.id) {
                toast(`${data.name} left`, { icon: '👋', duration: 2000 })
            }
            setOnlineUsers((prev: OnlineUser[]) =>{
                return prev.filter((u) => u.socketId! == data.socketId)
            })
        })

        socket.on('user:left', (data: {userId: string; name: string; socketId: string }) =>{
            if(data.userId ! == user.id) {
                toast (`${data.name} left`,{ icon: '👋', duration: 2000})

            }
            setOnlineUsers((prev: OnlineUser[]) =>
                prev.filter((u) => u.socketId ! == data.socketId)
            )
        })


        socket.on(
            'card:moved',
            (data:{
            cardId: string
            fromColumnId: string
            toColumnId: string
            newOrder: number
            movedBy: { userId: string;name: string }
            }) =>{
                applyCardMoved(data.cardId, data.fromColumnId, data.toColumnId,data.newOrder)

            }

        )

        socket.on(
            'card:created',
            (data: {columnId: string; card: Card; createdBy: { name: string } }) =>{
                applyCardCreated(data.columnId,data.card)
            }
        )

        socket.on(
            'card:update',
            (data: {
            ColumnId: string; 
            cardId: string;
            changes: Partial<Card>
            updatedBy: {name:string}
            }) =>{
                applyCardUpdated(data.ColumnId,data.cardId, data.changes)
            }
        )

        socket.on(
            'card: deleted',
            (data:{ columnId: string; cardId: string; deletedBy: {name:string}}) =>{
                applyCardDeleted(data.columnId,data.cardId)
            }
        )

        socket.on('column:created', (data:{column: Column; createdBy: {name: string}}) =>{
            applyColumnCreated(data.column)
        })

        socket.on('column: deleted', (data: {columnId: string; deletedBy: {name: string}}) =>{
            applyColumnDeleted(data.columnId)
        })

        socket.on('error', ({message }: {message: string }) =>{
            toast.error(message)
        })

        return () =>{
            socket.emit('board:leave', {boardId})
            socket.off('room:members')
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
    },[boardId, user])
}