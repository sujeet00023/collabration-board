'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, register, isLoading } = useAuthStore()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('Welcome back!')
      } else {
        await register(name, email, password)
        toast.success('Account created!')
      }
      // Handle pending invite redirect
      const pending = sessionStorage.getItem('pendingInvite')
      if (pending) {
        sessionStorage.removeItem('pendingInvite')
        router.push(`/invite/${pending}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {/* Floating cards decoration */}
        <div className="absolute top-32 right-8 w-48 bg-white/10 backdrop-blur rounded-xl p-4 rotate-3 border border-white/20">
          <div className="w-3/4 h-2 bg-white/40 rounded mb-2" />
          <div className="w-1/2 h-2 bg-white/20 rounded" />
        </div>
        <div className="absolute top-52 right-28 w-40 bg-indigo-500/20 backdrop-blur rounded-xl p-4 -rotate-2 border border-indigo-400/30">
          <div className="w-full h-2 bg-white/30 rounded mb-2" />
          <div className="w-2/3 h-2 bg-white/15 rounded" />
        </div>
        <div className="absolute bottom-48 right-12 w-44 bg-purple-500/20 backdrop-blur rounded-xl p-4 rotate-1 border border-purple-400/30">
          <div className="w-3/4 h-2 bg-white/30 rounded mb-2" />
          <div className="w-1/2 h-2 bg-white/15 rounded" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <span className="text-white font-semibold">CollabBoard</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your team's ideas,<br />organized in real-time
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Drag cards, see live cursors, chat with teammates — all in one board.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          {[
            { icon: '⚡', text: 'Real-time updates — see changes instantly' },
            { icon: '🖱️', text: 'Live cursors — see your teammates working' },
            { icon: '💬', text: 'Built-in chat — no need for external tools' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-lg">{f.icon}</span>
              <span className="text-indigo-200 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white"/>
                <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
                <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">CollabBoard</span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            {/* Toggle tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                  <input
                    type="text" className="input" placeholder="Sujeet Khupase"
                    value={name} onChange={e => setName(e.target.value)} required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
