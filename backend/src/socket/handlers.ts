import { Server, Socket } from 'socket.io'
import { Board } from '../models/Board'
import { RoomManager } from './roomManager'
import mongoose from 'mongoose'

interface JoinBoardPayload   { boardId: string }
interface CursorMovePayload  { boardId: string; x: number; y: number }
interface ChatMessagePayload { boardId: string; text: string }

interface CardMovedPayload {
  boardId: string; cardId: string
  fromColumnId: string; toColumnId: string; newOrder: number
}
interface CardCreatedPayload  { boardId: string; columnId: string; title: string }
interface CardUpdatedPayload  { boardId: string; columnId: string; cardId: string; changes: { title?: string; description?: string; label?: string | null } }
interface CardDeletedPayload  { boardId: string; columnId: string; cardId: string }
interface ColumnCreatedPayload { boardId: string; title: string }
interface ColumnDeletedPayload { boardId: string; columnId: string }

export function registerBoardHandlers(io: Server, socket: Socket): void {
  const { userId, name, color } = socket.user

  // ── BOARD: JOIN ────────────────────────────────────────────
  socket.on('board:join', async ({ boardId }: JoinBoardPayload) => {
    try {
      const board = await Board.findOne({
        _id: boardId,
        $or: [{ owner: userId }, { members: userId }],
      })
      if (!board) { socket.emit('error', { message: 'Access denied' }); return }

      socket.join(boardId)
      RoomManager.join(boardId, { socketId: socket.id, userId, name, color })

      io.to(boardId).emit('user:joined', {
        userId, name, color, socketId: socket.id,
        onlineCount: RoomManager.getCount(boardId),
      })
      socket.emit('room:members', { members: RoomManager.getMembers(boardId) })
    } catch { socket.emit('error', { message: 'Failed to join board' }) }
  })

  // ── BOARD: LEAVE ───────────────────────────────────────────
  socket.on('board:leave', ({ boardId }: JoinBoardPayload) => {
    socket.leave(boardId)
    RoomManager.leave(boardId, socket.id)
    io.to(boardId).emit('user:left', { userId, name, socketId: socket.id, onlineCount: RoomManager.getCount(boardId) })
  })

  // ── CURSOR: MOVE (throttled on client to ~30ms) ────────────
  socket.on('cursor:move', ({ boardId, x, y }: CursorMovePayload) => {
    // Broadcast to everyone EXCEPT the sender
    socket.to(boardId).emit('cursor:moved', { socketId: socket.id, userId, name, color, x, y })
  })

  // ── CURSOR: LEAVE (mouse left the board canvas) ────────────
  socket.on('cursor:leave', ({ boardId }: JoinBoardPayload) => {
    socket.to(boardId).emit('cursor:left', { socketId: socket.id, userId })
  })

  // ── CHAT: MESSAGE ──────────────────────────────────────────
  socket.on('chat:message', ({ boardId, text }: ChatMessagePayload) => {
    if (!text?.trim()) return
    const message = {
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      name,
      color,
      text: text.trim().slice(0, 500), // max 500 chars
      timestamp: new Date().toISOString(),
    }
    // Broadcast to ALL users in the room (including sender so they see their own message)
    io.to(boardId).emit('chat:message', message)
  })

  // ── CARD: MOVED ────────────────────────────────────────────
  socket.on('card:moved', async (payload: CardMovedPayload) => {
    const { boardId, cardId, fromColumnId, toColumnId, newOrder } = payload
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const fromColumn = board.columns.id(fromColumnId)
      const toColumn   = board.columns.id(toColumnId)
      if (!fromColumn || !toColumn) return
      const cardIdx = fromColumn.cards.findIndex(c => c._id.toString() === cardId)
      if (cardIdx === -1) return
      const [card] = fromColumn.cards.splice(cardIdx, 1)
      card.order = newOrder
      toColumn.cards.splice(newOrder, 0, card)
      fromColumn.cards.forEach((c, i) => { c.order = i })
      toColumn.cards.forEach((c, i) => { c.order = i })
      await board.save()
      io.to(boardId).emit('card:moved', { cardId, fromColumnId, toColumnId, newOrder, movedBy: { userId, name, color } })
    } catch { socket.emit('error', { message: 'Failed to move card' }) }
  })

  // ── CARD: CREATED ──────────────────────────────────────────
  socket.on('card:created', async ({ boardId, columnId, title }: CardCreatedPayload) => {
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const column = board.columns.id(columnId)
      if (!column) return
      const newCard = { _id: new mongoose.Types.ObjectId(), title, description: '', order: column.cards.length, label: null, assignee: null, createdAt: new Date() }
      column.cards.push(newCard)
      await board.save()
      io.to(boardId).emit('card:created', { columnId, card: column.cards[column.cards.length - 1], createdBy: { userId, name } })
    } catch { socket.emit('error', { message: 'Failed to create card' }) }
  })

  // ── CARD: UPDATED ──────────────────────────────────────────
  socket.on('card:updated', async ({ boardId, columnId, cardId, changes }: CardUpdatedPayload) => {
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const card = board.columns.id(columnId)?.cards.id(cardId)
      if (!card) return
      if (changes.title !== undefined) card.title = changes.title
      if (changes.description !== undefined) card.description = changes.description
      if (changes.label !== undefined) card.label = changes.label as any
      await board.save()
      io.to(boardId).emit('card:updated', { columnId, cardId, changes, updatedBy: { userId, name } })
    } catch { socket.emit('error', { message: 'Failed to update card' }) }
  })

  // ── CARD: DELETED ──────────────────────────────────────────
  socket.on('card:deleted', async ({ boardId, columnId, cardId }: CardDeletedPayload) => {
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const column = board.columns.id(columnId)
      if (!column) return
      const idx = column.cards.findIndex(c => c._id.toString() === cardId)
      if (idx !== -1) { column.cards.splice(idx, 1); column.cards.forEach((c, i) => { c.order = i }) }
      await board.save()
      io.to(boardId).emit('card:deleted', { columnId, cardId, deletedBy: { userId, name } })
    } catch { socket.emit('error', { message: 'Failed to delete card' }) }
  })

  // ── COLUMN: CREATED ────────────────────────────────────────
  socket.on('column:created', async ({ boardId, title }: ColumnCreatedPayload) => {
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const newCol = { _id: new mongoose.Types.ObjectId(), title, order: board.columns.length, cards: [] }
      board.columns.push(newCol)
      await board.save()
      io.to(boardId).emit('column:created', { column: board.columns[board.columns.length - 1], createdBy: { userId, name } })
    } catch { socket.emit('error', { message: 'Failed to create column' }) }
  })

  // ── COLUMN: DELETED ────────────────────────────────────────
  socket.on('column:deleted', async ({ boardId, columnId }: ColumnDeletedPayload) => {
    try {
      const board = await Board.findOne({ _id: boardId, $or: [{ owner: userId }, { members: userId }] })
      if (!board) return
      const idx = board.columns.findIndex(c => c._id.toString() === columnId)
      if (idx !== -1) board.columns.splice(idx, 1)
      await board.save()
      io.to(boardId).emit('column:deleted', { columnId, deletedBy: { userId, name } })
    } catch { socket.emit('error', { message: 'Failed to delete column' }) }
  })

  // ── DISCONNECT ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    const leftBoards = RoomManager.leaveAll(socket.id)
    for (const boardId of leftBoards) {
      // Remove cursor from all users
      io.to(boardId).emit('cursor:left', { socketId: socket.id, userId })
      io.to(boardId).emit('user:left', { userId, name, socketId: socket.id, onlineCount: RoomManager.getCount(boardId) })
    }
    console.log(`[socket] ${name} disconnected`)
  })
}
