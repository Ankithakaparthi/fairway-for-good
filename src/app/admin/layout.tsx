'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Trophy, Heart, ShieldCheck, BarChart2, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/draws', label: 'Draw Management', icon: Trophy },
  { href: '/admin/charities', label: 'Charities', icon: Heart },
  { href: '/admin/winners', label: 'Winners', icon: ShieldCheck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('is_admin, full_name').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      setAdminName(profile.full_name || 'Admin')
    }
    check()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen flex" style={{ background: '#0a1a0b' }}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/5 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`} style={{ background: 'rgba(15,30,16,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="font-display text-lg font-bold text-cream">
            Fairway <span className="text-gold-400">for Good</span>
          </Link>
          <div className="mt-1 text-xs text-red-400 font-medium uppercase tracking-widest">Admin Panel</div>
        </div>

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
          <div className="px-3 mb-3">
            <div className="text-sm text-cream">{adminName}</div>
            <div className="text-xs text-red-400">Administrator</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-cream/50 hover:text-cream hover:bg-white/5 transition-all"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/5 sticky top-0 z-20" style={{ background: 'rgba(10,26,11,0.95)', backdropFilter: 'blur(12px)' }}>
          <span className="font-display font-bold text-cream text-sm">Admin</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-cream/60 hover:text-cream">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
