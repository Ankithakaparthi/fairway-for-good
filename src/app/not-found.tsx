import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-display text-8xl font-bold text-forest-800 mb-2 select-none">404</div>
        <h1 className="font-display text-3xl font-bold text-cream mb-3">Hole not found</h1>
        <p className="text-cream/50 mb-8">
          Looks like this page is out of bounds. Let&apos;s get you back on the fairway.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="btn-gold px-6 py-3">Back to home</Link>
          <Link href="/dashboard" className="btn-outline px-6 py-3">My dashboard</Link>
        </div>
      </div>
    </div>
  )
}
