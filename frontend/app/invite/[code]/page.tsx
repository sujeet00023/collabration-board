'use client'
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import toast from "react-hot-toast"

type Status = 'loading' | 'joining' | 'success' | 'error' | 'needs-auth'

export default function InvitePage() {
    const params = useParams()
    const code = params.code as string
    const router = useRouter()
    const {user, init} = useAuthStore()
    const[Status, setStatus] = useState<Status>('loading')
    const[boardName, setBoardName] = useState(' ')
    const [error, setError] = useState('')

    useEffect(() =>{ init()}, [init])

    useEffect(()=>{
        if(!code) return

        if(status === 'loading'){
            const token= localStorage.getItem('token')
            if(!token){
                setStatus('needs-auth')
                return
            }
            joinBoard()
        }
    },[code, user])

    async function joinBoard() {
    setStatus('joining')
    try{
        const {data} =await api.post(`/api/boards/join/${code}`)
        setBoardName(data.board.name)
        setStatus('success')
        toast.success(`Joined "${data.board.name}"!`)
        setTimeout(() => router.push(`/board/${data.board._id}`), 1500)
    }catch (err: any){
        setError(err.response?.data?.error || 'Invalid or expired invite link')
        setStatus('error')
    }
    
}

function goToAuth(){
    sessionStorage.setItem('pendingInvite', code)
    router.push('/auth')
}

 return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">

        {/* Logo */}
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill="white"/>
            <rect x="11" y="2"  width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="2"  y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4"/>
          </svg>
        </div>

        {status === 'loading' && (
          <>
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Checking invite...</p>
          </>
        )}

        {status === 'joining' && (
          <>
            <div className="w-7 h-7 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Joining board...</h2>
            <p className="text-gray-400 text-sm">Just a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">You're in!</h2>
            <p className="text-gray-500 text-sm">Redirecting to <span className="font-medium text-gray-700">{boardName}</span>...</p>
          </>
        )}

        {status === 'needs-auth' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">You're invited!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Sign in or create a free account to join this board
            </p>
            <div className="space-y-2">
              <button onClick={goToAuth} className="btn-primary w-full">
                Sign in to join
              </button>
              <button onClick={() => router.push('/')} className="btn-secondary w-full text-sm">
                Go to homepage
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invite not found</h2>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
              Go to my boards
            </button>
          </>
        )}
      </div>
    </div>
  )
}


