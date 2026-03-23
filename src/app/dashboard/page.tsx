'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Star, Heart, Calendar, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Subscription, Score, Winner, Draw } from '@/types'
import { formatDate, formatAmount, getScoreColor } from '@/lib/utils'

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [winnings, setWinnings] = useState<Winner[]>([])
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profRes, subRes, scoresRes, winnersRes, drawRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*, charity:charities(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('scores').select('*').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5),
        supabase.from('winners').select('*, draw:draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('draws').select('*').eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false }).limit(1).maybeSingle(),
      ])

      setProfile(profRes.data)
      setSubscription(subRes.data)
      setScores(scoresRes.data || [])
      setWinnings(winnersRes.data || [])
      setLatestDraw(drawRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const totalWon = winnings.reduce((sum, w) => sum + w.prize_amount, 0)
  const avgScore = scores.length ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">
            Hello, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
          </h1>
          <p className="text-cream/50 mt-1 text-sm">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {subscription?.status !== 'active' && (
          <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-700/40 text-amber-300 text-xs px-3 py-2 rounded-xl">
            <AlertCircle size={14} />
            Subscription inactive
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Subscription',
            value: subscription ? `${subscription.plan} plan` : 'No plan',
            sub: subscription?.status === 'active' ? 'Active' : 'Inactive',
            icon: <Calendar size={18} />,
            color: 'text-forest-400',
            bg: 'bg-forest-900/40',
          },
          {
            label: 'Avg Score',
            value: avgScore || '—',
            sub: `${scores.length}/5 scores logged`,
            icon: <Star size={18} />,
            color: 'text-gold-400',
            bg: 'bg-gold-900/20',
          },
          {
            label: 'Total Won',
            value: totalWon > 0 ? formatAmount(totalWon) : '£0',
            sub: `${winnings.length} prizes`,
            icon: <Trophy size={18} />,
            color: 'text-amber-400',
            bg: 'bg-amber-900/20',
          },
          {
            label: 'Charity',
            value: subscription?.charity_percentage ? `${subscription.charity_percentage}%` : '10%',
            sub: subscription?.charity?.name || 'Not selected',
            icon: <Heart size={18} />,
            color: 'text-pink-400',
            bg: 'bg-pink-900/20',
          },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <div className="font-display text-xl font-bold text-cream truncate">{stat.value}</div>
            <div className="text-xs text-cream/40 mt-0.5 truncate">{stat.sub}</div>
            <div className="text-xs text-cream/30 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent scores */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-cream">My Scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-forest-400 hover:text-forest-300 flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-8">
              <Star size={32} className="text-cream/20 mx-auto mb-3" />
              <p className="text-cream/40 text-sm">No scores yet</p>
              <Link href="/dashboard/scores" className="text-forest-400 text-sm mt-2 inline-block hover:text-forest-300">
                Add your first score →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score, i) => (
                <div key={score.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-forest-900/60 flex items-center justify-center text-xs text-cream/50">
                      #{i + 1}
                    </div>
                    <div>
                      <div className="text-sm text-cream">{score.course_name || 'Golf course'}</div>
                      <div className="text-xs text-cream/40">{formatDate(score.played_date)}</div>
                    </div>
                  </div>
                  <div className={`font-display text-xl font-bold ${getScoreColor(score.score)}`}>
                    {score.score}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-cream/40">Average</span>
                <span className={`font-display font-bold ${getScoreColor(avgScore)}`}>{avgScore}</span>
              </div>
            </div>
          )}
        </div>

        {/* Latest draw + winnings */}
        <div className="space-y-4">
          {/* Latest draw */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-cream">Latest Draw</h2>
              <Link href="/dashboard/draws" className="text-xs text-forest-400 hover:text-forest-300 flex items-center gap-1">
                All draws <ArrowRight size={12} />
              </Link>
            </div>
            {latestDraw ? (
              <div>
                <div className="text-xs text-cream/40 mb-3">
                  {new Date(latestDraw.year, latestDraw.month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {latestDraw.drawn_numbers.map((n) => (
                    <div key={n} className="w-10 h-10 rounded-full bg-gold-900/30 border border-gold-600/30 flex items-center justify-center font-display font-bold text-gold-400 text-sm">
                      {n}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-4 text-xs text-cream/50">
                  <span>Pool: <span className="text-cream">{formatAmount(latestDraw.total_pool)}</span></span>
                  <span>·</span>
                  <span>Players: <span className="text-cream">{latestDraw.participant_count}</span></span>
                </div>
              </div>
            ) : (
              <div className="text-cream/40 text-sm text-center py-4">No published draws yet</div>
            )}
          </div>

          {/* Winnings */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-cream mb-4">Recent Winnings</h2>
            {winnings.length === 0 ? (
              <div className="text-center py-4">
                <Trophy size={28} className="text-cream/20 mx-auto mb-2" />
                <p className="text-cream/40 text-sm">No winnings yet — keep playing!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {winnings.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm text-cream">{w.prize_tier?.replace('match', '')} match</div>
                      <div className={`text-xs mt-0.5 ${w.payment_status === 'paid' ? 'text-forest-400' : 'text-amber-400'}`}>
                        {w.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </div>
                    <div className="font-display font-bold text-gold-400">{formatAmount(w.prize_amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA if no scores */}
      {scores.length < 5 && (
        <div className="glass-gold rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp size={24} className="text-gold-400" />
            <div>
              <div className="font-medium text-cream">You have {5 - scores.length} score slot{scores.length === 4 ? '' : 's'} remaining</div>
              <div className="text-sm text-cream/50">Add all 5 scores to maximise your draw chances</div>
            </div>
          </div>
          <Link href="/dashboard/scores" className="btn-gold text-sm py-2 px-5 whitespace-nowrap">
            Add scores
          </Link>
        </div>
      )}
    </div>
  )
}
