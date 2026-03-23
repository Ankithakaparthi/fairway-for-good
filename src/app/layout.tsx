import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Fairway for Good — Golf. Win. Give.',
  description: 'Subscribe, track your Stableford scores, win monthly prizes, and support the charities that matter to you.',
  keywords: 'golf, charity, subscription, prizes, stableford, fundraising',
  openGraph: {
    title: 'Fairway for Good',
    description: 'Golf. Win. Give.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a351c',
              color: '#faf8f3',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'var(--font-body)',
            },
            success: { iconTheme: { primary: '#3d7a41', secondary: '#faf8f3' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#faf8f3' } },
          }}
        />
      </body>
    </html>
  )
}
