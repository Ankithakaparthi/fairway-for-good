'use client'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-display text-6xl font-bold text-red-400 mb-4">Oops</div>
        <h1 className="font-display text-2xl font-bold text-cream mb-3">Something went wrong</h1>
        <p className="text-cream/50 text-sm mb-8 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="btn-gold px-6 py-2.5 text-sm">Try again</button>
          <Link href="/" className="btn-outline px-6 py-2.5 text-sm">Go home</Link>
        </div>
      </div>
    </div>
  )
}
