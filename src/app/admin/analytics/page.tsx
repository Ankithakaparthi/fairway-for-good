'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatAmount, getMonthName } from '@/lib/utils'

const COLORS = ['#3d7a41', '#d9a10e', '#5f9762', '#efc020', '#2d6131', '#b87d0a']

export default function AdminAnalyticsPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>({
    drawStats: [],
    charityStats: [],
    subscriptionGrowth: [],
    planSplit: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [drawsRes, charContribRes, subsRes] = await Promise.all([
        supabase.from('draws').select('*').eq('status', 'published').order('year').order('month'),
        supabase.from('charity_contributions').select('amount, charity:charities(name)'),
        supabase.from('subscriptions').select('plan, status, created_at').order('created_at'),
      ])

      const drawStats = (drawsRes.data || []).map(d => ({
        name: `${getMonthName(d.month).slice(0, 3)} ${d.year}`,
        pool: d.total_pool,
        participants: d.participant_count,
      }))

      // Group charity contributions
      const charityMap: Record<string, number> = {}
      for (const c of charContribRes.data || []) {
        const name = (c.charity as any)?.name || 'Unknown'
        charityMap[name] = (charityMap[name] || 0) + c.amount
      }
      const charityStats = Object.entries(charityMap)
        .map(([name, total]) => ({ name: name.split(' ')[0], total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)

      // Plan split
      const monthly = (subsRes.data || []).filter(s => s.plan === 'monthly').length
      const yearly = (subsRes.data || []).filter(s => s.plan === 'yearly').length
      const planSplit = [
        { name: 'Monthly', value: monthly },
        { name: 'Yearly', value: yearly },
      ]

      setStats({ drawStats, charityStats, planSplit })
      setLoading(false)
    }
    load()
  }, [])

  const tooltipStyle = {
    backgroundColor: '#1a351c',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#faf8f3',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Analytics</h1>
        <p className="text-cream/50 mt-1 text-sm">Platform performance overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Prize pool over time */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-cream mb-6">Monthly Prize Pool</h2>
            {stats.drawStats.length === 0 ? (
              <div className="text-center py-10 text-cream/30 text-sm">No draw data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.drawStats} barSize={36}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(250,248,243,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(250,248,243,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatAmount(v), 'Pool']} />
                  <Bar dataKey="pool" fill="#3d7a41" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Charity contributions */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-cream mb-6">Charity Contributions</h2>
              {stats.charityStats.length === 0 ? (
                <div className="text-center py-10 text-cream/30 text-sm">No contribution data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.charityStats} layout="vertical" barSize={20}>
                    <XAxis type="number" tick={{ fill: 'rgba(250,248,243,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(250,248,243,0.6)', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatAmount(v), 'Raised']} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                      {stats.charityStats.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan split */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold text-cream mb-6">Subscription Plans</h2>
              {stats.planSplit.every((p: any) => p.value === 0) ? (
                <div className="text-center py-10 text-cream/30 text-sm">No subscription data yet</div>
              ) : (
                <div className="flex items-center gap-8">
                  <PieChart width={160} height={160}>
                    <Pie data={stats.planSplit} cx={75} cy={75} innerRadius={45} outerRadius={72} dataKey="value" paddingAngle={3}>
                      {stats.planSplit.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                  <div className="space-y-3">
                    {stats.planSplit.map((p: any, i: number) => (
                      <div key={p.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                        <div>
                          <div className="text-sm font-medium text-cream">{p.name}</div>
                          <div className="text-xs text-cream/40">{p.value} subscribers</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Draw statistics table */}
          {stats.drawStats.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-display text-lg font-bold text-cream">Draw Statistics</h2>
              </div>
              <table className="table-dark w-full">
                <thead>
                  <tr>
                    <th className="text-left">Period</th>
                    <th className="text-right">Prize Pool</th>
                    <th className="text-right">Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.drawStats.map((d: any) => (
                    <tr key={d.name}>
                      <td className="text-cream">{d.name}</td>
                      <td className="text-right font-display font-bold text-gold-400">{formatAmount(d.pool)}</td>
                      <td className="text-right text-cream/60">{d.participants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
