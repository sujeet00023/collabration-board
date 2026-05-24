'use client'
import {useState, useRef, useEffect } from 'react'
import {useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { disconnectSocket } from '@/lib/socket'

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join(' ').toUpperCase().slice(0, 2)
}


interface NavbarProps {
    //optional right slot
    rightSlot?: React.ReactNode
    // Optional center slot -- breadcrumb / board name
    centerSlot?: React.ReactNode
}

export default function Navbar({ rightSlot, centerSlot }: NavbarProps){
    const {user, logout } = useAuthStore()
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)


    useEffect(() =>{
        function handler(e:MouseEvent){
            if (menuRef.current && !menuRef.current.contains(e.target as Node)){
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    },[])

    function handleLogout(){
        disconnectSocket()
        logout()
        router.push('/auth')
    }

    return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 z-50 flex-shrink-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill="white"/>
            <rect x="11" y="2"  width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="2"  y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.7"/>
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <span className="font-semibold text-gray-900 text-sm hidden sm:block">CollabBoard</span>
      </Link>

      {/* Divider */}
      {centerSlot && <div className="w-px h-5 bg-gray-200 flex-shrink-0" />}

      {/* Center slot — board name / breadcrumb */}
      {centerSlot && (
        <div className="flex-1 min-w-0 flex items-center">
          {centerSlot}
        </div>
      )}

      {/* Spacer when no center slot */}
      {!centerSlot && <div className="flex-1" />}

      {/* Right slot — presence bar, share button, chat */}
      {rightSlot && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot}
        </div>
      )}

      {/* User menu */}
      {user && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
              style={{ backgroundColor: user.color }}
            >
              {getInitials(user.name)}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block max-w-[100px] truncate">
              {user.name.split(' ')[0]}
            </span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  My boards
                </Link>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}