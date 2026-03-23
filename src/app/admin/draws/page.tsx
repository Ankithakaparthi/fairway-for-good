'use client'
import { useEffect, useState } from 'react'
import { Play, Eye, CheckCircle, RefreshCw, Trophy, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Draw } from '@/types'
import { randomDraw, algorithmicDraw, calculatePrizePool, runDrawSimulation } from '@/lib/draw-engine'
import { formatAmount, getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminDrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [simResult, setSimResult] = useState<any>(null)
  const [config, setConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    drawType: 'random' as 'random' | 'algorithmic',
  })

  const loadDraws = async () => {
    const { data } = await supabase.from('draws').select('*').order('year', { ascending: false }).order('month', { ascending: false })
    setDraws(data || [])
    setLoading(false)
  }

  useEffect(() => { loadDraws() }, [])

  const handleSimulate = async () => {
    setSimulating(true)
    setSimResult(null)
    try {
      // Get active subscribers + scores
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'active')

      if (!subs || subs.length === 0) {
        toast.error('No active subscribers found')
        setSimulating(false)
        return
      }

      const userIds = subs.map((s: any) => s.user_id)

      const { data: scores } = await supabase
        .from('scores')
        .select('user_id, score')
        .in('user_id', userIds)

      // Group scores by user
      const userScores: Record<string, number[]> = {}
      for (const s of scores || []) {
        if (!userScores[s.user_id]) userScores[s.user_id] = []
        userScores[s.user_id].push(s.score)
      }

      // Generate draw numbers
      let drawResult
      if (config.drawType === 'algorithmic') {
        const allScoreArrays = Object.values(userScores)
        drawResult = algorithmicDraw(allScoreArrays)
      } else {
        drawResult = randomDraw()
      }

      // Calculate pools (mock: 100 monthly, 20 yearly)
      const pools = calculatePrizePool(subs.length * 0.8, subs.length * 0.2, 0)

      // Build entries
      const entries = Object.entries(userScores)
        .filter(([, scores]) => scores.length >= 1)
        .map(([userId, scores]) => ({ userId, scores }))

      // Run simulation
      const result = runDrawSimulation(entries, drawResult.drawnNumbers, {
        jackpot: pools.jackpot,
        match4: pools.match4,
        match3: pools.match3,
      })

      setSimResult({
        ...result,
        pools,
        participantCount: entries.length,
        drawType: config.drawType,
      })
      toast.success('Simulation complete!')
    } catch (err: any) {
      toast.error('Simulation failed: ' + err.message)
    }
    setSimulating(false)
  }

  const handlePublish = async () => {
    if (!simResult) return
    if (!confirm(`Publish draw for ${getMonthName(config.month)} ${config.year}? This cannot be undone.`)) return
    setPublishing(true)

    try {
      // Check if draw already exists
      const { data: existing } = await supabase
        .from('draws')
        .select('id')
        .eq('month', config.month)
        .eq('year', config.year)
        .maybeSingle()

      let drawId: string

      if (existing) {
        await supabase.from('draws').update({
          drawn_numbers: simResult.drawnNumbers,
          draw_type: simResult.drawType,
          total_pool: simResult.pools.total,
          jackpot_pool: simResult.pools.jackpot,
          match4_pool: simResult.pools.match4,
          match3_pool: simResult.pools.match3,
          jackpot_rollover: simResult.rolloverAmount,
          participant_count: simResult.participantCount,
          status: 'published',
          published_at: new Date().toISOString(),
        }).eq('id', existing.id)
        drawId = existing.id
      } else {
        const { data: newDraw } = await supabase.from('draws').insert({
          month: config.month,
          year: config.year,
          drawn_numbers: simResult.drawnNumbers,
          draw_type: simResult.drawType,
          total_pool: simResult.pools.total,
          jackpot_pool: simResult.pools.jackpot,
          match4_pool: simResult.pools.match4,
          match3_pool: simResult.pools.match3,
          jackpot_rollover: simResult.rolloverAmount,
          participant_count: simResult.participantCount,
          status: 'published',
          published_at: new Date().toISOString(),
        }).select().single()
        drawId = newDraw!.id
      }

      // Create draw entries and winners
      const allResults = simResult.results
      if (allResults.length > 0) {
        const entryInserts = allResults.map((r: any) => ({
          draw_id: drawId,
          user_id: r.userId,
          scores_snapshot: r.scores,
          match_count: r.matchCount,
          prize_tier: r.tier,
          prize_amount: r.tier
            ? [...simResult.winners.match5, ...simResult.winners.match4, ...simResult.winners.match3]
                .find((w: any) => w.userId === r.userId)?.prize || 0
            : 0,
        }))

        await supabase.from('draw_entries').upsert(entryInserts, { onConflict: 'draw_id,user_id' })

        // Insert winners
        const winnerRows = [
          ...simResult.winners.match5.map((w: any) => ({ user_id: w.userId, prize_tier: 'match5', prize_amount: w.prize })),
          ...simResult.winners.match4.map((w: any) => ({ user_id: w.userId, prize_tier: 'match4', prize_amount: w.prize })),
          ...simResult.winners.match3.map((w: any) => ({ user_id: w.userId, prize_tier: 'match3', prize_amount: w.prize })),
        ].map(w => ({ ...w, draw_id: drawId, verification_status: 'pending', payment_status: 'pending' }))

        if (winnerRows.length > 0) {
          await supabase.from('winners').insert(winnerRows)
        }
      }

      toast.success('Draw published successfully!')
      setSimResult(null)
      loadDraws()
    } catch (err: any) {
      toast.error('Failed to publish: ' + err.message)
    }
    setPublishing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Draw Management</h1>
        <p className="text-cream/50 mt-1 text-sm">Configure, simulate, and publish monthly draws</p>
      </div>

      {/* Draw configurator */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-cream mb-5">Configure Draw</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-cream/60 mb-2">Month</label>
            <select
              value={config.month}
              onChange={e => setConfig({ ...config, month: parseInt(e.target.value) })}
              className="input-dark"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-cream/60 mb-2">Year</label>
            <select
              value={config.year}
              onChange={e => setConfig({ ...config, year: parseInt(e.target.value) })}
              className="input-dark"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-cream/60 mb-2">Draw method</label>
            <select
              value={config.drawType}
              onChange={e => setConfig({ ...config, drawType: e.target.value as any })}
              className="input-dark"
            >
              <option value="random">Random (standard)</option>
              <option value="algorithmic">Algorithmic (frequency-weighted)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="btn-outline flex items-center gap-2 py-2.5 px-6 disabled:opacity-50"
          >
            {simulating ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
            {simulating ? 'Simulating...' : 'Simulate draw'}
          </button>

          {simResult && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn-gold flex items-center gap-2 py-2.5 px-6 disabled:opacity-50"
            >
              {publishing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {publishing ? 'Publishing...' : 'Publish draw'}
            </button>
          )}
        </div>
      </div>

      {/* Simulation result */}
      {simResult && (
        <div className="glass rounded-2xl p-6 border border-gold-700/20">
          <div className="flex items-center gap-2 mb-5">
            <Play size={16} className="text-gold-400" />
            <h2 className="font-display text-lg font-bold text-cream">Simulation Result</h2>
            <span className="text-xs text-cream/40 ml-2">Preview only — not published</span>
          </div>

          {/* Drawn numbers */}
          <div className="mb-5">
            <div className="text-xs text-cream/40 uppercase tracking-wider mb-3">Drawn numbers</div>
            <div className="flex gap-3">
              {simResult.drawnNumbers.map((n: number, i: number) => (
                <div key={n} className="w-12 h-12 rounded-full bg-gold-400 text-charcoal flex items-center justify-center font-display font-bold text-lg draw-number" style={{ animationDelay: `${i * 150}ms` }}>
                  {n}
                </div>
              ))}
            </div>
          </div>

          {/* Pool breakdown */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total pool', value: formatAmount(simResult.pools.total), color: 'text-cream' },
              { label: '5-match (40%)', value: formatAmount(simResult.pools.jackpot), color: 'text-gold-400' },
              { label: '4-match (35%)', value: formatAmount(simResult.pools.match4), color: 'text-forest-400' },
              { label: '3-match (25%)', value: formatAmount(simResult.pools.match3), color: 'text-forest-500' },
            ].map(p => (
              <div key={p.label} className="bg-white/5 rounded-xl p-3 text-center">
                <div className={`font-display font-bold ${p.color}`}>{p.value}</div>
                <div className="text-xs text-cream/40 mt-1">{p.label}</div>
              </div>
            ))}
          </div>

          {/* Winners summary */}
          <div className="space-y-3">
            {[
              { tier: 'match5', label: '5-Number Match (Jackpot)', winners: simResult.winners.match5 },
              { tier: 'match4', label: '4-Number Match', winners: simResult.winners.match4 },
              { tier: 'match3', label: '3-Number Match', winners: simResult.winners.match3 },
            ].map(({ tier, label, winners }) => (
              <div key={tier} className="flex items-center justify-between p-3 bg-white/3 rounded-xl">
                <div className="flex items-center gap-3">
                  <Trophy size={14} className={tier === 'match5' ? 'text-gold-400' : 'text-forest-400'} />
                  <span className="text-sm text-cream">{label}</span>
                </div>
                <div className="text-sm font-medium">
                  {winners.length === 0
                    ? <span className="text-cream/40">No winners{tier === 'match5' ? ' — jackpot rolls over' : ''}</span>
                    : <span className="text-gold-400">{winners.length} winner{winners.length > 1 ? 's' : ''}</span>
                  }
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-cream/40">
            <Users size={12} />
            {simResult.participantCount} participants · {simResult.drawType} draw
            {simResult.rolloverAmount > 0 && (
              <span className="ml-2 text-amber-400">Jackpot rollover: {formatAmount(simResult.rolloverAmount)}</span>
            )}
          </div>
        </div>
      )}

      {/* Draw history */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-display text-lg font-bold text-cream">Published Draws</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-12 text-cream/30 text-sm">No draws published yet</div>
        ) : (
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th className="text-left">Period</th>
                <th className="text-left">Numbers</th>
                <th className="text-right">Pool</th>
                <th className="text-right">Participants</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {draws.map(draw => (
                <tr key={draw.id}>
                  <td className="text-cream font-medium">{getMonthName(draw.month)} {draw.year}</td>
                  <td>
                    <div className="flex gap-1.5">
                      {draw.drawn_numbers.map(n => (
                        <span key={n} className="w-7 h-7 rounded-full bg-gold-900/30 border border-gold-700/30 flex items-center justify-center text-xs font-bold text-gold-400">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right font-display font-bold text-cream">{formatAmount(draw.total_pool)}</td>
                  <td className="text-right text-cream/60">{draw.participant_count}</td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      draw.status === 'published' ? 'bg-forest-900/50 text-forest-400' :
                      draw.status === 'simulated' ? 'bg-amber-900/40 text-amber-400' :
                      'bg-white/5 text-cream/40'
                    }`}>
                      {draw.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
