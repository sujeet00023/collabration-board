import {Socket} from 'socket.io'
import jwt from 'jsonwebtoken'

export interface SocketUser{
    userId: string
    name:  string
    email: string
    color: string
}


//extend Socket type to carry user data
declare module 'socket.io' {
    interface Socket {
    user: SocketUser
    }
}

export function socketAuthMiddleware(
    socket: Socket,
    next:(err?: Error )=> void
): void {

    const token = socket.handshake.auth?.token as string | undefined

    if(!token){
        return next( new Error('AUTH_REQUIRED'))
    }

    try{
        const decoded =jwt.verify(token, process.env.JWT_SECRET!) as SocketUser
        socket.user = decoded
        next()
    }catch {
        next(new Error('AUTH_INVALID'))
    }
}