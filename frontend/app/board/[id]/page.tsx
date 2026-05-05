'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import { useBoardStore } from '../../../store/boardStore'
import toast from 'react-hot-toast'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Column } from '../../../types'
import ColumnCard from '../../components/board/ColumnCard'
import CardItem from '../../components/board/CardItem'

export default function BoardPage() {
  const params = useParams()
  const boardId = params.id as string
  const router = useRouter()
  const { user, init } = useAuthStore()
  const { activeBoard, fetchBoard, addColumn, isLoading, moveCard } = useBoardStore()

  const [newColTitle, setNewColTitle] = useState('')
  const [addingCol, setAddingCol] = useState(false)
  const [showAddCol, setShowAddCol] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    fetchBoard(boardId)
  }, [user, boardId, router, fetchBoard])

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!newColTitle.trim()) return
    setAddingCol(true)
    try {
      await addColumn(boardId, newColTitle.trim())
      setNewColTitle('')
      setShowAddCol(false)
      toast.success('Column added')
    } catch {
      toast.error('Failed to add column')
    } finally {
      setAddingCol(false)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCardId(null)
    if (!over || !activeBoard) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which column the card came from
    let fromColumn: Column | undefined
    let toColumn: Column | undefined
    let newOrder = 0

    for (const col of activeBoard.columns) {
      if (col.cards.some(c => c._id === activeId)) fromColumn = col
      if (col._id === overId || col.cards.some(c => c._id === overId)) toColumn = col
    }

    if (!fromColumn || !toColumn) return
    if (fromColumn._id === toColumn._id && activeId === overId) return

    // Calculate new order
    const overCardIndex = toColumn.cards.findIndex(c => c._id === overId)
    newOrder = overCardIndex === -1 ? toColumn.cards.length : overCardIndex

    try {
      await moveCard(boardId, activeId, fromColumn._id, toColumn._id, newOrder)
    } catch {
      toast.error('Failed to move card')
    }
  }

  const activeCard = activeBoard?.columns
    .flatMap(c => c.cards)
    .find(c => c._id === activeCardId)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Board Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900">
              {isLoading ? '...' : activeBoard?.name}
            </h1>
            {activeBoard && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                {activeBoard.inviteCode}
              </span>
            )}
          </div>

          {/* Members */}
          <div className="flex items-center gap-2">
            {activeBoard && (
              <div className="flex -space-x-2">
                {[activeBoard.owner, ...activeBoard.members].slice(0, 5).map((member, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: member.color }}
                    title={member.name}
                  >
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                if (activeBoard) {
                  navigator.clipboard.writeText(activeBoard.inviteCode)
                  toast.success('Invite code copied!')
                }
              }}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Share
            </button>
          </div>
        </div>
      </nav>

      {/* Board columns */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeBoard ? (
        <div className="flex-1 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 p-4 h-full items-start min-w-max">
              {activeBoard.columns
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <SortableContext
                    key={column._id}
                    items={column.cards.map(c => c._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ColumnCard column={column} boardId={boardId} />
                  </SortableContext>
                ))}

              {/* Add column */}
              <div className="w-72 flex-shrink-0">
                {showAddCol ? (
                  <form
                    onSubmit={handleAddColumn}
                    className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
                  >
                    <input
                      autoFocus
                      type="text"
                      className="input text-sm mb-2"
                      placeholder="Column name..."
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary text-sm py-1.5 flex-1" disabled={addingCol}>
                        {addingCol ? 'Adding...' : 'Add column'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddCol(false); setNewColTitle('') }}
                        className="btn-secondary text-sm py-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddCol(true)}
                    className="w-full bg-white/60 hover:bg-white border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-2"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add column
                  </button>
                )}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeCard && (
                <div className="bg-white rounded-lg border border-indigo-300 shadow-xl p-3 w-64 rotate-2 opacity-90">
                  <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Board not found
        </div>
      )}
    </div>
  )
}
