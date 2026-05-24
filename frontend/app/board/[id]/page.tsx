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
import { useSocket }   from '../../../hooks/useSocket'
import { useCursor, RemoteCursor } from '../../../hooks/useCursor'
import { useChat } from '../../../hooks/useChat'
import ColumnCard from '@/app/components/board/ColumnCard'
import PresenceBar from '@/app/components/board/PresenceBar'
import LiveCursors from '@/app/components/board/LiveCursors'
import ChatSidebar from '@/app/components/chat/ChatSidebar'
import ChatButton from '@/app/components/chat/ChatButton'
import { Column } from '../../../types'
import Navbar from '@/app/components/layout/Navbar'
import ShareModal from '@/app/components/ui/ShareModal'

export default function BoardPage() {
  const params   = useParams()
  const boardId  = params.id as string
  const router   = useRouter()
  const { user, init }                                             = useAuthStore()
  const { activeBoard, fetchBoard, addColumn, moveCard,
          onlineUsers, isLoading }                                 = useBoardStore()

  const [newColTitle, setNewColTitle] = useState('')
  const [showAddCol,  setShowAddCol]  = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [chatOpen,    setChatOpen]    = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [unread,      setUnread]      = useState(0)
  const [cursors, setCursors]         = useState<Record<string, RemoteCursor>>({})
  const boardContainerRef             = useRef<HTMLDivElement>(null)
  const prevMsgCount                  = useRef(0)

  // ── Hooks ────────────────────────────────────────────────────
  useSocket(boardId)
  const { message, sendMessage } = useChat(boardId)

  const handleCursorsChange = useCallback(
    (updater: (prev: Record<string, RemoteCursor>) => Record<string, RemoteCursor>) =>
      setCursors(updater),
    []
  )
  useCursor({ boardId, containerRef: boardContainerRef, onCursorsChange: handleCursorsChange })

  // Unread badge
  useEffect(() => {
    if (!chatOpen && message.length > prevMsgCount.current) {
      setUnread(u => u + (message.length - prevMsgCount.current))
    }
    prevMsgCount.current = message.length
  }, [message, chatOpen])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { init() }, [init])
  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    fetchBoard(boardId)
  }, [user, boardId, router, fetchBoard])

  function handleAddColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!newColTitle.trim()) return
    addColumn(boardId, newColTitle.trim())
    setNewColTitle(''); setShowAddCol(false)
  }

  function handleDragStart(e: DragStartEvent) { setActiveCardId(e.active.id as string) }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveCardId(null)
    if (!over || !activeBoard) return
    const aId = active.id as string
    const oId = over.id as string
    if (aId === oId) return

    let fromCol: Column | undefined, toCol: Column | undefined
    for (const col of activeBoard.columns) {
      if (col.cards.some(c => c._id === aId)) fromCol = col
      if (col._id === oId || col.cards.some(c => c._id === oId)) toCol = col
    }
    if (!fromCol || !toCol) return
    const overIdx  = toCol.cards.findIndex(c => c._id === oId)
    const newOrder = overIdx === -1 ? toCol.cards.length : overIdx
    moveCard(boardId, aId, fromCol._id, toCol._id, newOrder)
  }

  function openChat() { setChatOpen(true); setUnread(0) }

  const activeCard = activeBoard?.columns.flatMap(c => c.cards).find(c => c._id === activeCardId)

  if (!user) return null

  // ── Navbar slots ─────────────────────────────────────────────
  const centerSlot = activeBoard ? (
    <div className="flex items-center gap-2 min-w-0">
      <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </button>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      <span className="font-semibold text-gray-800 text-sm truncate">{activeBoard.name}</span>
    </div>
  ) : null

  const rightSlot = activeBoard ? (
    <>
      <PresenceBar users={onlineUsers} currentUserId={user.id} />
      <button
        onClick={() => setShowShare(true)}
        className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>
      <ChatButton unread={unread} isOpen={chatOpen} onClick={chatOpen ? () => setChatOpen(false) : openChat} />
    </>
  ) : null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar centerSlot={centerSlot} rightSlot={rightSlot} />

      {/* Main area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Board canvas */}
        <div ref={boardContainerRef} className="flex-1 overflow-auto relative select-none">
          <LiveCursors cursors={cursors} />

          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeBoard ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners}
              onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 p-4 items-start min-w-max min-h-full">
                {activeBoard.columns
                  .slice().sort((a, b) => a.order - b.order)
                  .map(col => (
                    <SortableContext key={col._id} items={col.cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                      <ColumnCard column={col} boardId={boardId} />
                    </SortableContext>
                  ))}

                {/* Add column */}
                <div className="w-72 flex-shrink-0">
                  {showAddCol ? (
                    <form onSubmit={handleAddColumn} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                      <input autoFocus type="text" className="input text-sm mb-2"
                        placeholder="Column name..."
                        value={newColTitle} onChange={e => setNewColTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') { setShowAddCol(false); setNewColTitle('') } }}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-sm py-1.5 flex-1" disabled={!newColTitle.trim()}>
                          Add column
                        </button>
                        <button type="button" onClick={() => { setShowAddCol(false); setNewColTitle('') }}
                          className="btn-secondary text-sm py-1.5">✕
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowAddCol(true)}
                      className="w-full bg-white/70 hover:bg-white border border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:text-gray-700 transition-all flex items-center gap-2">
                      <span className="text-base leading-none">+</span> Add column
                    </button>
                  )}
                </div>
              </div>

              <DragOverlay>
                {activeCard && (
                  <div className="bg-white rounded-lg border border-indigo-300 shadow-2xl p-3 w-64 rotate-2 opacity-95">
                    <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
                    {activeCard.description && <p className="text-xs text-gray-400 mt-1">{activeCard.description}</p>}
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

        {/* Chat sidebar */}
        {chatOpen && (
          <ChatSidebar messages={message} onSend={sendMessage} onClose={() => setChatOpen(false)} />
        )}
      </div>

      {/* Share modal */}
      {showShare && activeBoard && (
        <ShareModal
          boardName={activeBoard.name}
          inviteCode={activeBoard.inviteCode}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
