import {Router, Request, Response} from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// ----Register----
router.post('/register', async (req: Request, res:Response) => {
    try{
        const {name, email, password } = req.body

        if(!name || !email || !password ){
            return res.status(400).json ({ error: 'Name, email and password are required'})
        }

        if(password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters'})
        }

        const existing = await User.findOne({ email: email.toLowerCase() })
        if(existing) {
            return res.status(400).json({ error: 'An account with this email already exists' })

        }
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = await User.create({ name, email, password: hashedPassword})

        const token = jwt.sign(
            {userId: user._id, name: user.name, email: user.email, color: user.color },
            process.env.JWT_SECRET!,
            { expiresIn: '7d'}
        )
    res.status(201).json({
        token,
        user: {id: user._id, name: user.name, email: user.email, color: user.color},

    })


    }catch ( err: any){
        res.status(500).json({ error: 'Registration failed. please try again'})
    }
})


//----Login-----
router.post('/login', async (req: Request, res: Response) => {

    try{
        const {
            email, password 
        } = req.body

        if(!email || !password){
            return res.status(400).json({ error: 'Email and password are required'})
        }

        const user = await User.findOne({ email: email.toLowerCase() })

        if(!user){
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if(!isValid){
            return res.status(401).json({ error: 'Invalid email or password'})

        }

        const token = jwt.sign(
            {userId: user._id, name: user.name, email: user.email, color: user.color},
            process.env.JWT_SECRET!,
            {expiresIn: '7d'}

        )

        res.json({
            token,
            user:{id: user._id, name: user.name, email: user.email, color: user.color},

        })

    }catch{
        res.status(500).json({ error: 'Login failed. Please try again'})

    }
})


//Get current user

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) =>{
    try{
        const user = await User.findById(req.user?.userId)
        if (!user) return res.status(404).json({ error: ' User not found'})
         res.json({ user })

    }catch{
        res.status(500).json({ error: 'failed to fetch user'})
    }

})

export default router