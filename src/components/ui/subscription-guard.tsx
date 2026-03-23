'use client'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface SubscriptionGuardProps {
  isActive: boolean
  children: React.ReactNode
}

export function SubscriptionGuard({ isActive, children }: SubscriptionGuardProps) {
  if (isActive) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass-gold rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
          <AlertCircle size={32} className="text-gold-400 mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold text-cream mb-2">
            Active subscription required
          </h3>
          <p className="text-cream/60 text-sm mb-6 leading-relaxed">
            You need an active subscription to access this feature and enter draws.
          </p>
          <Link href="/auth/signup" className="btn-gold w-full py-3 block text-center">
            Subscribe now
          </Link>
        </div>
      </div>
    </div>
  )
}
