'use client'

interface Props{
    unread: number
    isOpen: boolean
    onClick: () => void
}


export default function ChatButton({ unread, isOpen, onClick }: Props) {
    return (
        <button
        onClick={onClick}
         className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isOpen
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    title="Toggle chat"
    >
    <svg width='15' height='15' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth='2'>
    <path d="M21 15a2 2 0 0 1-2 2H71-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span className="hidden sm:inline">Chat</span>

    {unread > 0 && !isOpen && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 animate-bounce">
            {unread > 9 ? '+9' : unread}
        </span>
    )}
    </button>
    )
}