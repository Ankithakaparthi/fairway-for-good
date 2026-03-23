'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    toast.success('Welcome back!')
    router.push(profile?.is_admin ? '/admin' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-cream/50 hover:text-cream text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="glass rounded-3xl p-8">
          <div className="mb-8">
            <Link href="/" className="font-display text-xl font-bold text-cream block mb-6">
              Fairway <span className="text-gold-400">for Good</span>
            </Link>
            <h1 className="font-display text-3xl font-bold text-cream mb-2">Welcome back</h1>
            <p className="text-cream/50 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-cream/60 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl text-base font-semibold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-cream/50">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
                Join now
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-4 bg-forest-950/50 rounded-xl border border-forest-800/30">
            <p className="text-xs text-cream/40 mb-2 font-medium uppercase tracking-wider">Demo credentials</p>
            <div className="space-y-1 text-xs text-cream/50">
              <p>User: user@demo.com / password123</p>
              <p>Admin: admin@demo.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
