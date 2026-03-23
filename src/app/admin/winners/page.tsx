'use client'
import { useEffect, useState } from 'react'
import { Check, X, ExternalLink, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatAmount, getMonthName, getTierLabel, getTierColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminWinnersPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all')
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadWinners = async () => {
    const { data } = await supabase
      .from('winners')
      .select('*, profile:profiles(full_name, email), draw:draws(month, year)')
      .order('created_at', { ascending: false })
    setWinners(data || [])
    setLoading(false)
  }

  useEffect(() => { loadWinners() }, [])

  const handleVerify = async (id: string, approve: boolean) => {
    const { error } = await supabase.from('winners').update({
      verification_status: approve ? 'approved' : 'rejected',
      admin_notes: notes[id] || null,
      verified_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) toast.error('Failed to update')
    else { toast.success(approve ? 'Winner approved!' : 'Winner rejected'); loadWinners() }
  }

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from('winners').update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) toast.error('Failed to update')
    else { toast.success('Marked as paid'); loadWinners() }
  }

  const filtered = winners.filter(w => {
    if (filter === 'pending') return w.verification_status === 'pending'
    if (filter === 'approved') return w.verification_status === 'approved' && w.payment_status === 'pending'
    if (filter === 'paid') return w.payment_status === 'paid'
    return true
  })

  const pendingCount = winners.filter(w => w.verification_status === 'pending').length
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0)
  const totalPending = winners.filter(w => w.payment_status === 'pending').reduce((s, w) => s + w.prize_amount, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Winners</h1>
        <p className="text-cream/50 mt-1 text-sm">Verify submissions and track payouts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="text-2xl font-display font-bold text-amber-400">{pendingCount}</div>
          <div className="text-xs text-cream/40 mt-1">Pending verification</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-2xl font-display font-bold text-forest-400">{formatAmount(totalPaid)}</div>
          <div className="text-xs text-cream/40 mt-1">Total paid out</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-2xl font-display font-bold text-gold-400">{formatAmount(totalPending)}</div>
          <div className="text-xs text-cream/40 mt-1">Pending payout</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-cream/40" />
        {(['all', 'pending', 'approved', 'paid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-colors ${
              filter === f ? 'bg-forest-700 text-cream' : 'bg-white/5 text-cream/50 hover:bg-white/10'
            }`}
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Winners list */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-cream/30 text-sm">No winners in this category</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(winner => (
              <div key={winner.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-sm font-bold text-cream flex-shrink-0">
                      {winner.profile?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-cream">{winner.profile?.full_name || 'Unknown'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTierColor(winner.prize_tier)}`}>
                          {getTierLabel(winner.prize_tier)}
                        </span>
                      </div>
                      <div className="text-xs text-cream/40 mt-0.5">{winner.profile?.email}</div>
                      <div className="text-xs text-cream/30 mt-0.5">
                        {winner.draw?.month && `${getMonthName(winner.draw.month)} ${winner.draw.year}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-gold-400">{formatAmount(winner.prize_amount)}</div>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        winner.verification_status === 'approved' ? 'bg-forest-900/50 text-forest-400' :
                        winner.verification_status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                        'bg-amber-900/30 text-amber-400'
                      }`}>
                        {winner.verification_status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        winner.payment_status === 'paid' ? 'bg-forest-900/50 text-forest-400' : 'bg-white/5 text-cream/40'
                      }`}>
                        {winner.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proof */}
                {winner.proof_url && (
                  <div className="mb-4">
                    <a
                      href={winner.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-forest-400 hover:text-forest-300 bg-forest-950/50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink size={14} /> View proof document
                    </a>
                  </div>
                )}

                {/* Admin actions */}
                {winner.verification_status === 'pending' && (
                  <div className="space-y-2">
                    {!winner.proof_url && (
                      <p className="text-xs text-amber-400">⚠ No proof uploaded yet</p>
                    )}
                    <div>
                      <input
                        type="text"
                        placeholder="Admin notes (optional)"
                        value={notes[winner.id] || ''}
                        onChange={e => setNotes({ ...notes, [winner.id]: e.target.value })}
                        className="input-dark text-sm py-2 mb-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(winner.id, true)}
                          className="flex items-center gap-1.5 text-sm bg-forest-800 hover:bg-forest-700 text-forest-200 px-4 py-2 rounded-xl transition-colors"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleVerify(winner.id, false)}
                          className="flex items-center gap-1.5 text-sm bg-red-900/40 hover:bg-red-900/60 text-red-300 px-4 py-2 rounded-xl transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                  <button
                    onClick={() => handleMarkPaid(winner.id)}
                    className="flex items-center gap-2 text-sm bg-gold-900/30 hover:bg-gold-900/50 text-gold-400 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Check size={14} /> Mark as paid
                  </button>
                )}

                {winner.admin_notes && (
                  <div className="mt-2 text-xs text-cream/40 italic">Note: {winner.admin_notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
