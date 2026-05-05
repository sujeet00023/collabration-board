'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'
import {useAuthStore} from '../store/authStore'


export default function Home() {
    const router = useRouter()
    const {user, init } = useAuthStore()

    useEffect(() => {
        init()
    },[init])

    useEffect(() =>
    {
        if(user) {
            router.replace('/dashboard')

        }else {
            router.replace('/auth')
        }

    },[user, router])


return(
    <div className='min-h-screen flex items-center justify-center'>
        <div className='w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin' />


    </div>
    
)}