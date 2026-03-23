'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Star, Heart, Trophy, User, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Subscription } from '@/types'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scores', label: 'My Scores', icon: Star },
  { href: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { href: '/dashboard/draws', label: 'Draws & Prizes', icon: Trophy },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*, charity:charities(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setSubscription(sub)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex bg-forest-950">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col glass border-r border-white/5 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-lg font-bold text-cream">
            Fairway <span className="text-gold-400">for Good</span>
          </Link>
        </div>

        {/* Subscription badge */}
        {subscription && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-forest-900/50 border border-forest-700/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cream/50">Status</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                subscription.status === 'active' ? 'bg-forest-700 text-forest-200' : 'bg-red-900/50 text-red-300'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div className="text-sm text-cream mt-1 font-medium capitalize">{subscription.plan} plan</div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(href)
                  ? 'bg-forest-800/60 text-cream'
                  : 'text-cream/50 hover:text-cream hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              {label}
              {isActive(href) && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          {profile && (
            <div className="flex items-center gap-3 mb-4 px-3">
              <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-xs font-semibold text-cream">
                {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-cream truncate">{profile.full_name || 'Golfer'}</div>
                <div className="text-xs text-cream/40 truncate">{profile.email}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-cream/50 hover:text-cream hover:bg-white/5 transition-all"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/5 glass sticky top-0 z-20">
          <Link href="/" className="font-display font-bold text-cream">
            Fairway <span className="text-gold-400">for Good</span>
          </Link>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cream/60 hover:text-cream">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
