import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import { connectDB } from './lib/db'
import boardRoutes from './routes/boards'

dotenv.config()

const app = express()
const httpServer = createServer(app)

//---Middleware----
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,

}))

app.use(express.json())

//-----Routes-------
app.use('/api/auth', authRoutes)
app.use('/api/boards', boardRoutes)

//-------Health----
app.get('/health', (_,res) => res.json({status: 'OK'}))


const PORT = process.env.PORT || 5000

async function start(){
    await connectDB()
    httpServer.listen(PORT, () =>{
    console.log(`🚀 Server running on http://localhost: ${PORT}`)

    })
}

start().catch(console.error)
