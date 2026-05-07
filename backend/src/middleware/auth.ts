import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'

export  interface AuthRequest extends Request {
   user?: {
    userId: string
    name: string
    email: string
    color: string
  }
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
):void {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        res.status(401).json({ error: 'No token provided Please login'})
        return
    }

  const token = authHeader.split(' ')[1]
    
    
    try{
        const decoded= jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string
            name: string
            email: string
            color: string
        }
        req.user = decoded
        next()

    }catch{
        res.status(401).json({ error: 'Tokenis invalid or expired. Please log in again'})
    }
}
