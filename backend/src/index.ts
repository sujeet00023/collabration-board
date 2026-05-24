import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './lib/db'
import authRoutes from './routes/auth'
import boardRoutes from './routes/boards'
import { socketAuthMiddleware } from './socket/socketAuth'
import { registerBoardHandlers } from './socket/handlers'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// ── CORS ──────────────────────────────────────────────────────
// Accept: your Vercel app, Vercel previews, Render itself, localhost
const corsOptions = {
  origin: (origin: string | undefined, cb: (err: null, allow?: boolean) => void) => {
    // Allow requests with no origin (health checks, curl, Postman)
    if (!origin) return cb(null, true)

    const allowed =
      !origin ||
      origin.endsWith('.vercel.app') ||          // all Vercel deployments
      origin.endsWith('.onrender.com') ||         // Render internal calls
      origin.includes('localhost') ||             // local dev
      origin === process.env.FRONTEND_URL         // exact production URL

    if (allowed) {
      cb(null, true)
    } else {
      console.warn('[CORS] blocked origin:', origin)
      cb(null, false)   // return false instead of throwing — prevents crash
    }
  },
  credentials: true,
}

// ── Socket.io ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: (origin: string | undefined, cb: (err: null, allow?: boolean) => void) => {
      cb(null, true)   // Socket.io: allow all — JWT handles auth anyway
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
})

io.use(socketAuthMiddleware)
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.user.name} (${socket.id})`)
  registerBoardHandlers(io, socket)
})

// ── Express ───────────────────────────────────────────────────
app.use(cors(corsOptions))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/boards', boardRoutes)

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// ── Start ─────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000

async function start() {
  await connectDB()
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`)
  })
}

start().catch(console.error)