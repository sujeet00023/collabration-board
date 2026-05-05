import { create } from 'zustand'
import { Board } from '../types'
import api from '../lib/api'

interface BoardState {
  boards: Board[]
  activeBoard: Board | null
  isLoading: boolean
  fetchBoards: () => Promise<void>
  fetchBoard: (id: string) => Promise<void>
  createBoard: (name: string, description?: string) => Promise<Board>
  deleteBoard: (id: string) => Promise<void>
  addColumn: (boardId: string, title: string) => Promise<void>
  renameColumn: (boardId: string, columnId: string, title: string) => Promise<void>
  deleteColumn: (boardId: string, columnId: string) => Promise<void>
  addCard: (boardId: string, columnId: string, title: string) => Promise<void>
  updateCard: (boardId: string, columnId: string, cardId: string, data: Partial<{ title: string; description: string; label: string }>) => Promise<void>
  deleteCard: (boardId: string, columnId: string, cardId: string) => Promise<void>
  moveCard: (boardId: string, cardId: string, fromColumnId: string, toColumnId: string, newOrder: number) => Promise<void>
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,

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

  addColumn: async (boardId, title) => {
    const { data } = await api.post(`/api/boards/${boardId}/columns`, { title })
    set((s) => ({
      activeBoard: s.activeBoard
        ? { ...s.activeBoard, columns: [...s.activeBoard.columns, data.column] }
        : null,
    }))
  },

  renameColumn: async (boardId, columnId, title) => {
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

  deleteColumn: async (boardId, columnId) => {
    await api.delete(`/api/boards/${boardId}/columns/${columnId}`)
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.filter((c) => c._id !== columnId),
          }
        : null,
    }))
  },

  addCard: async (boardId, columnId, title) => {
    const { data } = await api.post(
      `/api/boards/${boardId}/columns/${columnId}/cards`,
      { title }
    )
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId ? { ...c, cards: [...c.cards, data.card] } : c
            ),
          }
        : null,
    }))
  },

  updateCard: async (boardId, columnId, cardId, updates) => {
    const { data } = await api.patch(
      `/api/boards/${boardId}/columns/${columnId}/cards/${cardId}`,
      updates
    )
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.map((card : any) => card._id === cardId ? data.card : card) }
                : c
            ),
          }
        : null,
    }))
  },

  deleteCard: async (boardId, columnId, cardId) => {
    await api.delete(`/api/boards/${boardId}/columns/${columnId}/cards/${cardId}`)
    set((s) => ({
      activeBoard: s.activeBoard
        ? {
            ...s.activeBoard,
            columns: s.activeBoard.columns.map((c) =>
              c._id === columnId
                ? { ...c, cards: c.cards.filter((card: any) => card._id !== cardId) }
                : c
            ),
          }
        : null,
    }))
  },

  moveCard: async (boardId, cardId, fromColumnId, toColumnId, newOrder) => {
    await api.patch(`/api/boards/${boardId}/move-card`, {
      cardId, fromColumnId, toColumnId, newOrder,
    })
    await get().fetchBoard(boardId)
  },
}))
