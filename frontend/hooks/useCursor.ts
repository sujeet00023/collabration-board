import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '../lib/socket'

export interface RemoteCursor {
  socketId: string
  userId: string
  name: string
  color: string
  x: number  // percentage of board container width
  y: number  // percentage of board container height
}

interface UseCursorOptions {
  boardId: string
  containerRef: React.RefObject<HTMLElement>
  onCursorsChange: (updater: (prev: Record<string, RemoteCursor>) => Record<string, RemoteCursor>) => void
}

export function useCursor({ boardId, containerRef, onCursorsChange }: UseCursorOptions) {
  const lastEmitRef = useRef(0)
  const THROTTLE_MS = 30  // emit at most every 30ms (~33fps) — smooth but not spammy

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now()
    if (now - lastEmitRef.current < THROTTLE_MS) return
    lastEmitRef.current = now

    const container = containerRef.current
    if (!container) return
  
    const rect = container.getBoundingClientRect()

    // Send as percentages so it works across different screen sizes
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Only emit if cursor is inside the board container
    if (x < 0 || x > 100 || y < 0 || y > 100) return

    getSocket().emit('cursor:move', { boardId, x, y })
  }, [boardId, containerRef])

  const handleMouseLeave = useCallback(() => {
    getSocket().emit('cursor:leave', { boardId })
  }, [boardId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      // Tell server cursor is gone
      getSocket().emit('cursor:leave', { boardId })
    }
  }, [boardId, containerRef, handleMouseMove, handleMouseLeave])

  // Listen for other users' cursor updates
  useEffect(() => {
    const socket = getSocket()

    socket.on('cursor:moved', (cursor: RemoteCursor) => {
      onCursorsChange(prev => ({ ...prev, [cursor.socketId]: cursor }))
    })

    socket.on('cursor:left', ({ socketId }: { socketId: string }) => {
      onCursorsChange(prev => {
        const next = { ...prev }
        delete next[socketId]
        return next
      })
    })
    
    return () => {
      socket.off('cursor:moved')
      socket.off('cursor:left')
    }
  }, [onCursorsChange])
}
