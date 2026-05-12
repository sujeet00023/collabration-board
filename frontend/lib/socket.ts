import {io, Socket } from 'socket.io-client'

let socket: Socket | null = null


export function getSocket(): Socket {
    if( socket && socket.connected ) return socket

    const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    :null



    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth:{ token },
        autoConnect : true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    })


    socket.on('connect', () => {
        console.log('[socket] connected:', socket?.id)
    })

    socket.on('connect_error', (err) => {
        console.error('[socket] connection error:', err.message)

    })

    socket.on('disconnect', (reason) =>{
        console.log('[socket] disconnected:', reason)
    })

    return socket
}


export function disconnectSocket(): void {
    if(socket) {
        socket.disconnect()
        socket = null
    }
}