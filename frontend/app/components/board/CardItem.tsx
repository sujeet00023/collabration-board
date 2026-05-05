'use client'
import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../../../types'
import { useBoardStore } from '../../../store/boardStore'
import toast from 'react-hot-toast'

interface Props {
  card: Card
  columnId: string
  boardId: string
}

const LABEL_COLORS: Record<string, string> = {
  bug:         'bg-red-100 text-red-600',
  feature:     'bg-blue-100 text-blue-600',
  improvement: 'bg-purple-100 text-purple-600',
  task:        'bg-green-100 text-green-600',
}

export default function CardItem({ card, columnId, boardId }: Props) {
  const { updateCard, deleteCard } = useBoardStore()
  const [showModal, setShowModal] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [editDesc, setEditDesc] = useState(card.description)
  const [editLabel, setEditLabel] = useState(card.label || '')
  const [saving, setSaving] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCard(boardId, columnId, card._id, {
        title: editTitle,
        description: editDesc,
        label: editLabel || null,
      } as any)
      setShowModal(false)
      toast.success('Card updated')
    } catch {
      toast.error('Failed to update card')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this card?')) return
    try {
      await deleteCard(boardId, columnId, card._id)
      setShowModal(false)
      toast.success('Card deleted')
    } catch {
      toast.error('Failed to delete card')
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-indigo-200 transition-all group ${
          isDragging ? 'shadow-xl scale-105' : ''
        }`}
        onClick={() => { setShowModal(true); setEditTitle(card.title); setEditDesc(card.description); setEditLabel(card.label || '') }}
      >
        {/* Label */}
        {card.label && (
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-2 ${LABEL_COLORS[card.label]}`}>
            {card.label}
          </span>
        )}

        <p className="text-sm text-gray-800 font-medium leading-snug">{card.title}</p>

        {card.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{card.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-300">
            {new Date(card.createAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          {card.assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: (card.assignee as any).color || '#6366f1' }}
              title={(card.assignee as any).name}
            >
              {((card.assignee as any).name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit card</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  autoFocus
                  type="text"
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Add more details..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <select
                  className="input"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                >
                  <option value="">No label</option>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="improvement">Improvement</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleDelete} className="btn-danger text-sm px-3 py-2">
                Delete
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editTitle.trim()}
                className="btn-primary text-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
