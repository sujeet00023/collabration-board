'use client'
import { useEffect, useRef, useState } from "react"
import { ChatMessage } from "@/hooks/useChat"
import { useAuthStore } from "@/store/authStore"

interface Props {
    messages: ChatMessage[]
    onSend: (text: string) => void
    onClose: () => void
}

function formatTime( iso: string) {
    return new Date(iso).toLocaleTimeString('en-In', {hour: '2-digit', minute: '2-digit' })
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ChatSidebar({messages, onSend, onClose}: Props) {
    const {user} = useAuthStore()
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    //Auto-scroll to buttom when new messages arrive
    useEffect(() =>{
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    },[messages])


    useEffect(() =>{
        inputRef.current?.focus()
    },[])

    function handleSend(e?: React.FormEvent) {
        e?.preventDefault()
        if (!input.trim()) return
        onSend(input.trim())
        setInput(' ')
    }


    function handleKeyDown(e: React.KeyboardEvent) {
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault()
            handleSend()
        }
    }

    function isSameUSerAsPrev(idx: number){
        if(idx === 0) return false
        return messages[idx].userId === messages[idx- 1].userId
    }


    return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-gray-800">Board chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.userId === user?.id
            const grouped = isSameUSerAsPrev(idx)

            return (
              <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                {/* Avatar — only show on first message in a group */}
                {!grouped && !isOwn && (
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                    style={{ backgroundColor: msg.color }}
                    title={msg.name}
                  >
                    {getInitials(msg.name)}
                  </div>
                )}
                {grouped && !isOwn && <div className="w-6 flex-shrink-0" />}

                <div className={`max-w-[200px] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Name + time — only on first in group */}
                  {!grouped && (
                    <div className={`flex items-baseline gap-1.5 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-medium text-gray-700">
                        {isOwn ? 'You' : msg.name.split(' ')[0]}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-sm leading-relaxed break-words ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    } ${grouped && isOwn ? 'rounded-tr-2xl' : ''} ${grouped && !isOwn ? 'rounded-tl-2xl' : ''}`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 p-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder-gray-400"
            placeholder="Message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-300 mt-1 text-center">Press Enter to send</p>
      </div>
    </div>
  )
}