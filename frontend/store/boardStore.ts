import { create } from 'zustand'
import { Board, Card, Column } from '../types'
import api from '../lib/api'
import { getSocket } from '../lib/socket'

interface OnlineUser {
  socketId: string
  userId: string
  name: string
  color: string
}

interface BoardState {
  boards: Board[]
  activeBoard: Board | null
  onlineUsers: OnlineUser[]
  isLoading: boolean

  // Data fetching
  fetchBoards: () => Promise<void>
  fetchBoard: (id: string) => Promise<void>
  createBoard: (name: string, description?: string) => Promise<Board>
  deleteBoard: (id: string) => Promise<void>

  // Presence
  setOnlineUsers: (users: OnlineUser[] | ((prev: OnlineUser[]) => OnlineUser[])) => void

  // Column actions (emit via socket)
  addColumn: (boardId: string, title: string) => void
  renameColumn: (boardId: string, columnId: string, title: string) => Promise<void>
  deleteColumn: (boardId: string, columnId: string) => void

  // Card actions (emit via socket — optimistic)
  addCard: (boardId: string, columnId: string, title: string) => void
  updateCard: (boardId: string, columnId: string, cardId: string, changes: Partial<Card>) => void
  deleteCard: (boardId: string, columnId: string, cardId: string) => void
  moveCard: (boardId: string, cardId: string, fromColumnId: string, toColumnId: string, newOrder: number) => void

  // Socket-driven apply methods (called by useSocket hook)
  applyCardMoved: (cardId: string, fromColumnId: string, toColumnId: string, newOrder: number) => void
  applyCardCreated: (columnId: string, card: Card) => void
  applyCardUpdated: (columnId: string, cardId: string, changes: Partial<Card>) => void
  applyCardDeleted: (columnId: string, cardId: string) => void
  applyColumnCreated: (column: Column) => void
  applyColumnDeleted: (columnId: string) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoard: null,
  onlineUsers: [],
  isLoading: false,

  // ── Presence ──────────────────────────────────────────────
  setOnlineUsers: (users) =>
    set((s) => ({
      onlineUsers: typeof users === 'function' ? users(s.onlineUsers) : users,
    })),

  // ── Data fetching ─────────────────────────────────────────
  fetchBoards: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/api/boards')
      set({ boards: data.boards })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchBoard: async (id) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get(`/api/boards/${id}`)
      set({ activeBoard: data.board })
    } finally {
      set({ isLoading: false })
    }
  },

  createBoard: async (name, description = '') => {
    const { data } = await api.post('/api/boards', { name, description })
    set((s) => ({ boards: [data.board, ...s.boards] }))
    return data.board
  },

  deleteBoard: async (id) => {
    await api.delete(`/api/boards/${id}`)
    set((s) => ({ boards: s.boards.filter((b) => b._id !== id) }))
  },

  // ── Column actions (via Socket) ───────────────────────────
  addColumn: (boardId, title) => {
    // Optimistic update
    const tempCol: Column = {
      _id: `temp_${Date.now()}`,
      title,
      order: get().activeBoard?.columns.length ?? 0,
      cards: [],
    }
    set((s) => ({
      activeBoard: s.activeBoard
        ? { ...s.activeBoard, columns: [...s.activeBoard.columns, tempCol] }
        : null,
    }))
    // Emit to server — all users get column:created back
    getSocket().emit('column:created', { boardId, title })
  },

  renameColumn: async (boardId, columnId, title) => {
    // REST call for rename (no socket needed — low frequency action)
    await api.patch(`/api/boards/${boardId}/columns/${columnId}`, { title })
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId ? { ...c, title } : c
            ),
          }
        : null,
    }))
  },

  deleteColumn: (boardId, columnId) => {
    // Optimistic update
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.filter((c) => c._id !== columnId),
          }
        : null,
    }))
    getSocket().emit('column:deleted', { boardId, columnId })
  },

  // ── Card actions (via Socket — optimistic) ────────────────
  addCard: (boardId, columnId, title) => {
    // Optimistic — add a temp card immediately
    const tempCard: Card = {
      _id: `temp_${Date.now()}`,
      title,
      description: '',
      order: get().activeBoard?.columns.find((c) => c._id === columnId)?.cards.length ?? 0,
      label: null,
      createAt: new Date().toISOString(),
    }
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId ? { ...c, cards: [...c.cards, tempCard] } : c
            ),
          }
        : null,
    }))
    // Server will broadcast card:created with the real _id to all users
    getSocket().emit('card:created', { boardId, columnId, title })
  },

  updateCard: (boardId, columnId, cardId, changes) => {
    // Optimistic
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.map((card) => card._id === cardId ? { ...card, ...changes } : card) }
                : c
            ),
          }
        : null,
    }))
    getSocket().emit('card:updated', { boardId, columnId, cardId, changes })
  },

  deleteCard: (boardId, columnId, cardId) => {
    // Optimistic
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.filter((card) => card._id !== cardId) }
                : c
            ),
          }
        : null,
    }))
    getSocket().emit('card:deleted', { boardId, columnId, cardId })
  },

  moveCard: (boardId, cardId, fromColumnId, toColumnId, newOrder) => {
    // 1. Optimistic UI update immediately
    get().applyCardMoved(cardId, fromColumnId, toColumnId, newOrder)
    // 2. Emit to server — server saves + broadcasts to all other users
    getSocket().emit('card:moved', { boardId, cardId, fromColumnId, toColumnId, newOrder })
  },

  // ── Socket apply methods (called by useSocket hook) ───────
  applyCardMoved: (cardId, fromColumnId, toColumnId, newOrder) => {
    set((s) => {
      if (!s.activeBoard) return s
      const columns = s.activeBoard.columns.map((c) => ({ ...c, cards: [...c.cards] }))

      const fromCol = columns.find((c) => c._id === fromColumnId)
      const toCol = columns.find((c) => c._id === toColumnId)
      if (!fromCol || !toCol) return s

      const cardIdx = fromCol.cards.findIndex((c) => c._id === cardId)
      if (cardIdx === -1) return s

      const [card] = fromCol.cards.splice(cardIdx, 1)
      card.order = newOrder
      toCol.cards.splice(newOrder, 0, card)

      fromCol.cards.forEach((c, i) => { c.order = i })
      toCol.cards.forEach((c, i) => { c.order = i })

      return { activeBoard: { ...s.activeBoard, columns } }
    })
  },

  applyCardCreated: (columnId, card) => {
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) => {
              if (c._id !== columnId) return c
              // Replace temp card (if exists) or just add
              const withoutTemp = c.cards.filter((x) => !x._id.startsWith('temp_'))
              return { ...c, cards: [...withoutTemp, card] }
            }),
          }
        : null,
    }))
  },

  applyCardUpdated: (columnId, cardId, changes) => {
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.map((card) => card._id === cardId ? { ...card, ...changes } : card) }
                : c
            ),
          }
        : null,
    }))
  },

  applyCardDeleted: (columnId, cardId) => {
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.filter((card) => card._id !== cardId) }
                : c
            ),
          }
        : null,
    }))
  },

  applyColumnCreated: (column) => {
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: [
              // Remove any temp column, add real one
              ...s.activeBoard.columns.filter((c) => !c._id.startsWith('temp_')),
              column,
            ],
          }
        : null,
    }))
  },

  applyColumnDeleted: (columnId) => {
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.filter((c) => c._id !== columnId),
          }
        : null,
    }))
  },
}))
