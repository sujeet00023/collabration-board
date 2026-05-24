'use client'
import { useState  } from "react"
import toast from "react-hot-toast"

interface Props{
    boardName: string
    inviteCode: string
    onClose: () => void
}

export default function ShareModal({ boardName, inviteCode, onClose}: Props){
    const [copied, setCopied] = useState<'link' | 'code' | null>(null)

    const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/invite/${inviteCode}`
    : ''

    async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied('link')
    toast.success('Link copied!')
    setTimeout(() => setCopied(null), 2000)
        
    }

    async function copyCode(){
        await navigator.clipboard.writeText(inviteCode)
        setCopied('code')
        toast.success('Code copied')
        setTimeout(()=> setCopied(null), 2000)

    }

     return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-900">Share board</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Invite teammates to <span className="font-medium text-gray-700">{boardName}</span>
        </p>

        {/* Invite link */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Invite link
          </label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 truncate font-mono">
              {inviteLink}
            </div>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                copied === 'link'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied === 'link' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or share code</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Invite code */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            8-character code
          </label>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
            <div className="flex gap-2">
              {inviteCode.split('').map((char, i) => (
                <span
                  key={i}
                  className="w-8 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-lg font-bold text-gray-800 shadow-sm"
                >
                  {char}
                </span>
              ))}
            </div>
            <button
              onClick={copyCode}
              className={`ml-3 p-2 rounded-lg transition-all ${
                copied === 'code'
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              }`}
              title="Copy code"
            >
              {copied === 'code' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Anyone with this code can join the board
          </p>
        </div>
      </div>
    </div>
  )
}