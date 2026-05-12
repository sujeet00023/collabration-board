import {Server, Socket } from 'socket.io'
import { Board } from '../models/Board'
import { RoomManager, RoomMember } from './roomManager'
import mongoose from 'mongoose'

interface JoinBoardPayload {
    boardId: string
}

interface CardMovedPayload{
    boardId: string
    cardId: string
    fromColumnId: string
    toColumnId: string
    newOrder: number
}

interface CardCreatedPayload{
    boardId: string
    columnId: string
    title: string
}

interface CardUpdatedPayload {
    boardId: string
    columnId: string
    cardId: string
    changes: {
        title?: string
        description?: string
        label?: string | null  
    }
    
}

interface CardDeletedPayload {
    boardId: string
    columnId: string
    cardId: string
}

interface ColumnCreatedPayload {
  boardId: string
  title: string
}

interface ColumnDeletedPayload {
  boardId: string
  columnId: string
}

//------Register all handlers for a connected socket---
export function registerBoardHandlers(io: Server, socket: Socket): void {

    const { userId, name, color } = socket.user
   
     //--------Board: JOIN---------
     socket.on('board:join', async ({ boardId }: JoinBoardPayload ) => {
        try{
            //verify user has access to this board
            const board = await Board.findOne({
                _id: boardId,
                $or: [{ owner: userId }, { members: userId }]
            })


            if(!board){
                socket.emit('error', {message: 'Access denied to this board'})
                return
            }

            //Join the socket.io room
            socket.join(boardId)

            //Track in Presence map
            RoomManager.join(boardId, {
                socketId: socket.id,
                userId,
                name,
                color
            })
    
            //TRell everyone in the room this user joined
            io.to(boardId).emit('user: joined', {
                userId,
                name,
                color,
                socketId: socket.id,
                onlineCount: RoomManager.getCount(boardId),
            })

            //Send current online members to the joining user
            socket.emit('room:members',{
                members:RoomManager.getMembers(boardId),
            })

            console.log(`[room] ${name} joined board ${boardId}`)

        }catch (err){
            socket.emit('error', {message: 'Failed to join board '})
        }
     })
     


     //-----BOARD: LEAVE----------
     socket.on('board:leave', ({ boardId }: JoinBoardPayload) =>{
        socket.leave(boardId)
        RoomManager.leave(boardId, socket.id)

        io.to(boardId).emit('user:left', {
            userId,
            name,
            socketId: socket.id,
            onlineCount: RoomManager.getCount(boardId)
        })

        console.log(`[room] ${name} left board ${boardId}`)
     })
 // ── CARD: MOVED (drag & drop) ───────────────────────────────
  socket.on('card:moved', async (payload: CardMovedPayload) => {
    const { boardId, cardId, fromColumnId, toColumnId, newOrder } = payload

    try {
      // Verify access
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const fromColumn = board.columns.id(fromColumnId)
      const toColumn = board.columns.id(toColumnId)
      if (!fromColumn || !toColumn) return

      const cardIndex = fromColumn.cards.findIndex(
        (c) => c._id.toString() === cardId
      )
      if (cardIndex === -1) return

      // Remove from source
      const [card] = fromColumn.cards.splice(cardIndex, 1)
      card.order = newOrder

      // Insert into target at new position
      toColumn.cards.splice(newOrder, 0, card)

      // Re-index both columns
      fromColumn.cards.forEach((c, i) => { c.order = i })
      toColumn.cards.forEach((c, i) => { c.order = i })

      await board.save()

      // Broadcast to ALL users in the room (including sender)
      io.to(boardId).emit('card:moved', {
        cardId,
        fromColumnId,
        toColumnId,
        newOrder,
        movedBy: { userId, name, color },
      })

      console.log(`[card] ${name} moved card ${cardId}`)
    } catch (err) {
      socket.emit('error', { message: 'Failed to move card' })
    }
  })

  // ── CARD: CREATED ───────────────────────────────────────────
  socket.on('card:created', async (payload: CardCreatedPayload) => {
    const { boardId, columnId, title } = payload
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const column = board.columns.id(columnId)
      if (!column) return

      const newCard = {
        _id: new mongoose.Types.ObjectId(),
        title,
        description: '',
        order: column.cards.length,
        label: null,
        assignee: null,
        createdAt: new Date(),
      }
      column.cards.push(newCard)
      await board.save()

      // Broadcast new card to all room members
      io.to(boardId).emit('card:created', {
        columnId,
        card: column.cards[column.cards.length - 1],
        createdBy: { userId, name },
      })
    } catch {
      socket.emit('error', { message: 'Failed to create card' })
    }
  })

  // ── CARD: UPDATED ───────────────────────────────────────────
  socket.on('card:updated', async (payload: CardUpdatedPayload) => {
    const { boardId, columnId, cardId, changes } = payload
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const column = board.columns.id(columnId)
      const card = column?.cards.id(cardId)
      if (!card) return

      if (changes.title !== undefined) card.title = changes.title
      if (changes.description !== undefined) card.description = changes.description
      if (changes.label !== undefined) card.label = changes.label as any
      await board.save()

      io.to(boardId).emit('card:updated', {
        columnId,
        cardId,
        changes,
        updatedBy: { userId, name },
      })
    } catch {
      socket.emit('error', { message: 'Failed to update card' })
    }
  })

  // ── CARD: DELETED ───────────────────────────────────────────
  socket.on('card:deleted', async (payload: CardDeletedPayload) => {
    const { boardId, columnId, cardId } = payload
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const column = board.columns.id(columnId)
      if (!column) return

      const idx = column.cards.findIndex((c) => c._id.toString() === cardId)
      if (idx !== -1) column.cards.splice(idx, 1)
      column.cards.forEach((c, i) => { c.order = i })
      await board.save()

      io.to(boardId).emit('card:deleted', {
        columnId,
        cardId,
        deletedBy: { userId, name },
      })
    } catch {
      socket.emit('error', { message: 'Failed to delete card' })
    }
  })

  // ── COLUMN: CREATED ─────────────────────────────────────────
  socket.on('column:created', async (payload: ColumnCreatedPayload) => {
    const { boardId, title } = payload
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const newColumn = {
        _id: new mongoose.Types.ObjectId(),
        title,
        order: board.columns.length,
        cards: [],
      }
      board.columns.push(newColumn)
      await board.save()

      io.to(boardId).emit('column:created', {
        column: board.columns[board.columns.length - 1],
        createdBy: { userId, name },
      })
    } catch {
      socket.emit('error', { message: 'Failed to create column' })
    }
  })

  // ── COLUMN: DELETED ─────────────────────────────────────────
  socket.on('column:deleted', async (payload: ColumnDeletedPayload) => {
    const { boardId, columnId } = payload
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) return

      const idx = board.columns.findIndex((c) => c._id.toString() === columnId)
      if (idx !== -1) board.columns.splice(idx, 1)
      await board.save()

      io.to(boardId).emit('column:deleted', {
        columnId,
        deletedBy: { userId, name },
      })
    } catch {
      socket.emit('error', { message: 'Failed to delete column' })
    }
  })

  // ── DISCONNECT ──────────────────────────────────────────────
  socket.on('disconnect', () => {
    const leftBoards = RoomManager.leaveAll(socket.id)
    for (const boardId of leftBoards) {
      io.to(boardId).emit('user:left', {
        userId,
        name,
        socketId: socket.id,
        onlineCount: RoomManager.getCount(boardId),
      })
    }
    console.log(`[socket] ${name} disconnected`)
  })
}
