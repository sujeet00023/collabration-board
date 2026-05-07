import mongoose from 'mongoose'

let isConnected = false


export async function connectDB(): Promise<void> {
    if (isConnected) return 

    const URI = process.env.MONGODB_URI
    if (!URI) throw new Error ('MONGODB_URI is not defined in env')

    await mongoose.connect(URI)
    isConnected = true
    console.log('MongoDB connected')

}