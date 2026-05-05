import type { Metadata } from "next/types";
import {Inter} from 'next/font/google'
import './global.css'
import { Toast, Toaster } from "react-hot-toast";
import { Children } from "react";

const inter =Inter({ subsets: ['latin']})


export const metadata: Metadata ={
    title: 'CollabBoard - Real-Time Collabration',
    description: 'A real-time collaborative bopard for your team',

}

export default function RootLayout({ children }: { children: React.ReactNode}){
 return(
    <html lang="en">
    <body className={inter.className}>
    {children}
    <Toaster position="top-right"></Toaster>
    </body>
    </html>
)}
 