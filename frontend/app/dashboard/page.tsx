'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useBoardStore } from '../../store/boardStore'
import toast from 'react-hot-toast'
import { Board } from '../../types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, init } = useAuthStore()
  const { boards, fetchBoards, createBoard, deleteBoard, isLoading } = useBoardStore()
  const [showCreate, setShowCreate] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDesc, setBoardDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (!user) { router.replace('/auth'); return }
    fetchBoards()
  }, [user, router, fetchBoards])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!boardName.trim()) return
    setCreating(true)
    try {
      const board = await createBoard(boardName.trim(), boardDesc.trim())
      toast.success('Board created!')
      setShowCreate(false)
      setBoardName('')
      setBoardDesc('')
      router.push(`/board/${board._id}`)
    } catch {
      toast.error('Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(board: Board) {
    if (!confirm(`Delete "${board.name}"? This cannot be undone.`)) return
    try {
      await deleteBoard(board._id)
      toast.success('Board deleted')
    } catch {
      toast.error('Failed to delete board')
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setJoining(true)
    try {
      const res = await import('../../lib/api').then(m => m.default.post(`/api/boards/join/${inviteCode.trim()}`))
      toast.success('Joined board!')
      setShowJoin(false)
      setInviteCode('')
      router.push(`/board/${res.data.board._id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid invite code')
    } finally {
      setJoining(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/auth')
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900">CollabBoard</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user.color }}
            >
              {getInitials(user.name)}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
            <p className="text-gray-500 text-sm mt-1">
              {boards.length} board{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowJoin(true)} className="btn-secondary text-sm">
              Join board
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
              + New board
            </button>
          </div>
        </div>

        {/* Boards grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="11" height="11" rx="2" fill="#6366f1" opacity="0.3"/>
                <rect x="17" y="4" width="11" height="11" rx="2" fill="#6366f1" opacity="0.5"/>
                <rect x="4" y="17" width="11" height="11" rx="2" fill="#6366f1" opacity="0.5"/>
                <rect x="17" y="17" width="11" height="11" rx="2" fill="#6366f1" opacity="0.2"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first board to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create your first board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board._id}
                className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/board/${board._id}`)}
              >
                {/* Board color strip */}
                <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-4" />

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{board.name}</h3>
                    {board.description && (
                      <p className="text-gray-500 text-xs mt-1 truncate">{board.description}</p>
                    )}
                  </div>
                  {/* Delete button — only visible on hover, only for owner */}
                  {board.owner._id === user.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(board) }}
                      className="opacity-0 group-hover:opacity-100 ml-2 text-gray-400 hover:text-red-500 transition-all p-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {/* Member avatars */}
                  <div className="flex -space-x-2">
                    {[board.owner, ...board.members].slice(0, 4).map((member, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: member.color }}
                        title={member.name}
                      >
                        {getInitials(member.name)}
                      </div>
                    ))}
                    {board.members.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                        +{board.members.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(board.updateAt)}</div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  {board.columns.reduce((acc, col) => acc + col.cards.length, 0)} cards ·{' '}
                  {board.columns.length} columns
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create board modal */}
      {showCreate && (
        <Modal title="Create new board" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Board name *</label>
              <input
                autoFocus
                type="text"
                className="input"
                placeholder="e.g. Product Roadmap"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="What's this board for?"
                value={boardDesc}
                onChange={(e) => setBoardDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={creating || !boardName.trim()}>
                {creating ? 'Creating...' : 'Create board'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Join board modal */}
      {showJoin && (
        <Modal title="Join a board" onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invite code</label>
              <input
                autoFocus
                type="text"
                className="input uppercase tracking-widest"
                placeholder="e.g. AB12CD34"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={8}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Ask the board owner to share their invite code</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={joining || inviteCode.length !== 8}>
                {joining ? 'Joining...' : 'Join board'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
