'use client'
import { useState } from 'react'
import { Column } from '../../../types'
import { useBoardStore } from '../../../store/boardStore'
import toast from 'react-hot-toast'
import CardItem from './CardItem'
import { useDroppable } from '@dnd-kit/core'

interface Props {
  column: Column
  boardId: string
}

export default function ColumnCard({ column, boardId }: Props) {
  const { addCard, renameColumn, deleteColumn } = useBoardStore()
  const [cardTitle, setCardTitle] = useState('')
  const [showAddCard, setShowAddCard] = useState(false)
  const [addingCard, setAddingCard] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [colTitle, setColTitle] = useState(column.title)

  const { setNodeRef, isOver } = useDroppable({ id: column._id })

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault()
    if (!cardTitle.trim()) return
    setAddingCard(true)
    try {
      await addCard(boardId, column._id, cardTitle.trim())
      setCardTitle('')
      setShowAddCard(false)
    } catch {
      toast.error('Failed to add card')
    } finally {
      setAddingCard(false)
    }
  }

  async function handleRenameColumn() {
    if (!colTitle.trim() || colTitle === column.title) {
      setColTitle(column.title)
      setEditingTitle(false)
      return
    }
    try {
      await renameColumn(boardId, column._id, colTitle.trim())
      setEditingTitle(false)
    } catch {
      toast.error('Failed to rename column')
      setColTitle(column.title)
    }
  }

  async function handleDeleteColumn() {
    if (column.cards.length > 0) {
      if (!confirm(`Delete "${column.title}" and all ${column.cards.length} cards? This cannot be undone.`)) return
    }
    try {
      await deleteColumn(boardId, column._id)
      toast.success('Column deleted')
    } catch {
      toast.error('Failed to delete column')
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 bg-gray-100 rounded-xl flex flex-col max-h-[calc(100vh-120px)] transition-colors ${
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''
      }`}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        {editingTitle ? (
          <input
            autoFocus
            type="text"
            className="flex-1 text-sm font-semibold bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none"
            value={colTitle}
            onChange={(e) => setColTitle(e.target.value)}
            onBlur={handleRenameColumn}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameColumn()
              if (e.key === 'Escape') { setColTitle(column.title); setEditingTitle(false) }
            }}
          />
        ) : (
          <button
            className="flex-1 text-sm font-semibold text-gray-700 text-left hover:text-indigo-600 transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {column.title}
          </button>
        )}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 bg-gray-200 rounded px-1.5 py-0.5 font-medium">
            {column.cards.length}
          </span>
          <button
            onClick={handleDeleteColumn}
            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
            title="Delete column"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[40px]">
        {column.cards
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((card) => (
            <CardItem key={card._id} card={card} columnId={column._id} boardId={boardId} />
          ))}
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {showAddCard ? (
          <form onSubmit={handleAddCard} className="bg-white rounded-lg border border-gray-200 p-2">
            <textarea
              autoFocus
              className="w-full text-sm border-none outline-none resize-none text-gray-800 placeholder-gray-400"
              rows={2}
              placeholder="Enter card title..."
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(e as any) }
                if (e.key === 'Escape') { setShowAddCard(false); setCardTitle('') }
              }}
            />
            <div className="flex gap-1 mt-1">
              <button type="submit" disabled={addingCard || !cardTitle.trim()} className="btn-primary text-xs py-1 px-3">
                {addingCard ? '...' : 'Add'}
              </button>
              <button type="button" onClick={() => { setShowAddCard(false); setCardTitle('') }} className="text-gray-400 hover:text-gray-600 text-xs px-2">
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg px-2 py-1.5 transition-colors flex items-center gap-1"
          >
            <span>+</span> Add card
          </button>
        )}
      </div>
    </div>
  )
}
