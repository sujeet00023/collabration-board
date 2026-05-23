'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import { useBoardStore } from '../../../store/boardStore'
import toast from 'react-hot-toast'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSocket } from '../../../hooks/useSocket'
import { useCursor, RemoteCursor } from '../../../hooks/useCursor'
import { useChat } from '../../../hooks/useChat'
import ColumnCard from '@/app/components/board/ColumnCard'
import PresenceBar from '@/app/components/board/PresenceBar'
import LiveCursors from '@/app/components/board/LiveCursors'
import ChatSidebar from '@/app/components/chat/ChatSidebar'
import ChatButton from '@/app/components/chat/ChatButton'
import { Column } from '../../../types'

export default function BoardPage() {
  const params = useParams()
  const boardId = params.id as string
  const router = useRouter()
  const { user, init } = useAuthStore()
  const { activeBoard, fetchBoard, addColumn, moveCard, onlineUsers, isLoading } = useBoardStore()

  const [newColTitle, setNewColTitle] = useState('')
  const [showAddCol, setShowAddCol] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  // ── Chat state ───────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // ── Cursor state ─────────────────────────────────────────────
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})
  const boardContainerRef = useRef<HTMLDivElement>(null)

  // ── Hooks ────────────────────────────────────────────────────
  useSocket(boardId)

  const { message, sendMessage } = useChat(boardId)

  // Track unread when chat is closed
  const prevMsgCount = useRef(0)
  useEffect(() => {
    if (!chatOpen && message.length > prevMsgCount.current) {
      setUnread(u => u + (message.length - prevMsgCount.current))
    }
    prevMsgCount.current = message.length
  }, [message, chatOpen])

  const handleCursorsChange = useCallback(
    (updater: (prev: Record<string, RemoteCursor>) => Record<string, RemoteCursor>) => {
      setCursors(updater)
    },
    []
  )

  useCursor({
    boardId,
    containerRef: boardContainerRef,
    onCursorsChange: handleCursorsChange,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    fetchBoard(boardId)
  }, [user, boardId, router, fetchBoard])

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!newColTitle.trim()) return
    addColumn(boardId, newColTitle.trim())
    setNewColTitle('')
    setShowAddCol(false)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCardId(null)
    if (!over || !activeBoard) return
    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    let fromColumn: Column | undefined
    let toColumn: Column | undefined
    for (const col of activeBoard.columns) {
      if (col.cards.some(c => c._id === activeId)) fromColumn = col
      if (col._id === overId || col.cards.some(c => c._id === overId)) toColumn = col
    }
    if (!fromColumn || !toColumn) return
    const overIdx = toColumn.cards.findIndex(c => c._id === overId)
    const newOrder = overIdx === -1 ? toColumn.cards.length : overIdx
    moveCard(boardId, activeId, fromColumn._id, toColumn._id, newOrder)
  }

  function openChat() {
    setChatOpen(true)
    setUnread(0)
  }

  const activeCard = activeBoard?.columns.flatMap(c => c.cards).find(c => c._id === activeCardId)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex-shrink-0 z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 text-sm truncate">
              {isLoading ? '...' : activeBoard?.name}
            </h1>
            {activeBoard && (
              <span
                className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-mono cursor-pointer hover:bg-indigo-50 hover:text-indigo-500 transition-colors flex-shrink-0 hidden sm:block"
                title="Click to copy invite code"
                onClick={() => { navigator.clipboard.writeText(activeBoard.inviteCode); toast.success('Invite code copied!') }}
              >
                {activeBoard.inviteCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <PresenceBar users={onlineUsers} currentUserId={user.id} />
            <ChatButton unread={unread} isOpen={chatOpen} onClick={chatOpen ? () => setChatOpen(false) : openChat} />
          </div>
        </div>
      </nav>

      {/* Main area: board + chat sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Board area — cursor tracking container */}
        <div
          ref={boardContainerRef}
          className="flex-1 overflow-auto relative"
          style={{ cursor: 'default' }}
        >
          {/* Live cursors layer (absolute, pointer-events-none) */}
          <LiveCursors cursors={cursors} />

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeBoard ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 p-4 items-start min-w-max min-h-full">
                {activeBoard.columns
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map(column => (
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
                        onChange={e => setNewColTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') { setShowAddCol(false); setNewColTitle('') } }}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-sm py-1.5 flex-1" disabled={!newColTitle.trim()}>
                          Add column
                        </button>
                        <button type="button" onClick={() => { setShowAddCol(false); setNewColTitle('') }} className="btn-secondary text-sm py-1.5">
                          ✕
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddCol(true)}
                      className="w-full bg-white/60 hover:bg-white border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg leading-none">+</span> Add column
                    </button>
                  )}
                </div>
              </div>

              <DragOverlay>
                {activeCard && (
                  <div className="bg-white rounded-lg border border-indigo-300 shadow-2xl p-3 w-64 rotate-2 opacity-95">
                    <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
                    {activeCard.description && (
                      <p className="text-xs text-gray-400 mt-1">{activeCard.description}</p>
                    )}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Board not found or access denied
            </div>
          )}
        </div>

        {/* Chat sidebar — slides in */}
        {chatOpen && (
          <ChatSidebar
            messages={message}
            onSend={sendMessage}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
