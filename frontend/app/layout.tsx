import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './global.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CollabBoard — Real-time Collaboration',
  description: 'Drag cards, see live cursors, chat with teammates — all in one board.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#4f46e5',
  manifest: '/manifest.json',
  openGraph: {
    title: 'CollabBoard',
    description: 'Real-time collaborative boards for your team',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'inherit',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
