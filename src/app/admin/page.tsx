'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Trophy, Heart, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatAmount } from '@/lib/utils'

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalPrizePool: 0,
    totalCharityRaised: 0,
    pendingWinners: 0,
    drawsPublished: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentWinners, setRecentWinners] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const [usersRes, subsRes, drawsRes, winnersRes, charContribRes, pendingWinnersRes, recentUsersRes, recentWinnersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('draws').select('total_pool').eq('status', 'published'),
        supabase.from('winners').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('charity_contributions').select('amount'),
        supabase.from('winners').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('winners').select('*, profile:profiles(full_name,email), draw:draws(month,year)').order('created_at', { ascending: false }).limit(5),
      ])

      const totalPool = (drawsRes.data || []).reduce((sum: number, d: any) => sum + (d.total_pool || 0), 0)
      const totalCharity = (charContribRes.data || []).reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

      setStats({
        totalUsers: usersRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        totalPrizePool: totalPool,
        totalCharityRaised: totalCharity,
        pendingWinners: pendingWinnersRes.count || 0,
        drawsPublished: drawsRes.data?.length || 0,
      })
      setRecentUsers(recentUsersRes.data || [])
      setRecentWinners(recentWinnersRes.data || [])
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total users', value: stats.totalUsers.toLocaleString(), icon: <Users size={20} />, color: 'text-forest-400', bg: 'bg-forest-900/40', href: '/admin/users' },
    { label: 'Active subscribers', value: stats.activeSubscriptions.toLocaleString(), icon: <TrendingUp size={20} />, color: 'text-gold-400', bg: 'bg-gold-900/20', href: '/admin/users' },
    { label: 'Total prize pool', value: formatAmount(stats.totalPrizePool), icon: <Trophy size={20} />, color: 'text-amber-400', bg: 'bg-amber-900/20', href: '/admin/draws' },
    { label: 'Charity raised', value: formatAmount(stats.totalCharityRaised), icon: <Heart size={20} />, color: 'text-pink-400', bg: 'bg-pink-900/20', href: '/admin/charities' },
    { label: 'Pending winners', value: stats.pendingWinners, icon: <DollarSign size={20} />, color: 'text-red-400', bg: 'bg-red-900/20', href: '/admin/winners' },
    { label: 'Draws published', value: stats.drawsPublished, icon: <Trophy size={20} />, color: 'text-blue-400', bg: 'bg-blue-900/20', href: '/admin/draws' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Admin Overview</h1>
        <p className="text-cream/50 mt-1 text-sm">Platform health at a glance</p>
      </div>

      {stats.pendingWinners > 0 && (
        <Link href="/admin/winners" className="flex items-center justify-between p-4 bg-amber-900/30 border border-amber-700/40 rounded-xl hover:border-amber-600/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm text-amber-300">
              {stats.pendingWinners} winner{stats.pendingWinners === 1 ? '' : 's'} awaiting verification
            </span>
          </div>
          <ArrowRight size={14} className="text-amber-400" />
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link key={card.label} href={card.href} className="glass rounded-2xl p-5 hover:bg-white/5 transition-colors">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color} mb-3`}>
              {card.icon}
            </div>
            <div className="font-display text-2xl font-bold text-cream">{card.value}</div>
            <div className="text-xs text-cream/40 mt-1">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cream">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-forest-400 hover:text-forest-300">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-xs text-cream font-medium flex-shrink-0">
                  {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-cream truncate">{u.full_name || 'User'}</div>
                  <div className="text-xs text-cream/40 truncate">{u.email}</div>
                </div>
                <div className="text-xs text-cream/30">
                  {new Date(u.created_at).toLocaleDateString('en-GB')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent winners */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-cream">Recent Winners</h2>
            <Link href="/admin/winners" className="text-xs text-forest-400 hover:text-forest-300">View all →</Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentWinners.length === 0 ? (
              <div className="text-center py-8 text-cream/30 text-sm">No winners yet</div>
            ) : recentWinners.map((w: any) => (
              <div key={w.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                  w.prize_tier === 'match5' ? 'bg-gold-900/40 text-gold-400' :
                  w.prize_tier === 'match4' ? 'bg-forest-900/40 text-forest-400' :
                  'bg-forest-950 text-forest-500'
                }`}>
                  {w.prize_tier?.replace('match', '')} match
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-cream truncate">{w.profile?.full_name || w.profile?.email || 'User'}</div>
                  <div className="text-xs text-cream/40">{w.draw?.month && `${w.draw.month}/${w.draw.year}`}</div>
                </div>
                <div className="text-sm font-display font-bold text-gold-400">{formatAmount(w.prize_amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-base font-bold text-cream mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/draws" className="btn-gold text-sm py-2 px-5">Run draw →</Link>
          <Link href="/admin/charities" className="btn-outline text-sm py-2 px-5">Manage charities</Link>
          <Link href="/admin/winners" className="btn-outline text-sm py-2 px-5">Verify winners</Link>
          <Link href="/admin/users" className="btn-outline text-sm py-2 px-5">Manage users</Link>
        </div>
      </div>
    </div>
  )
}
