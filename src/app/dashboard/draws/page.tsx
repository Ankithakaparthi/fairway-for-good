'use client'
import { useEffect, useState } from 'react'
import { Trophy, Upload, Check, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Draw, DrawEntry, Winner } from '@/types'
import { formatAmount, getMonthName, getTierLabel, getTierColor } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function DrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>([])
  const [myEntries, setMyEntries] = useState<DrawEntry[]>([])
  const [myWinnings, setMyWinnings] = useState<Winner[]>([])
  const [uploading, setUploading] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [drawsRes, entriesRes, winnersRes] = await Promise.all([
        supabase.from('draws').select('*').eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false }),
        supabase.from('draw_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('winners').select('*, draw:draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setDraws(drawsRes.data || [])
      setMyEntries(entriesRes.data || [])
      setMyWinnings(winnersRes.data || [])
    }
    load()
  }, [])

  const handleProofUpload = async (winnerId: string) => {
    if (!proofFile) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const fileExt = proofFile.name.split('.').pop()
    const fileName = `${user.id}/${winnerId}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, proofFile, { upsert: true })
    if (uploadError) {
      toast.error('Upload failed')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(fileName)
    const { error } = await supabase
      .from('winners')
      .update({ proof_url: publicUrl, verification_status: 'pending' })
      .eq('id', winnerId)
    if (error) {
      toast.error('Failed to submit proof')
    } else {
      toast.success('Proof submitted for review!')
      setProofFile(null)
    }
    setUploading(false)
  }

  const totalWon = myWinnings.reduce((sum, w) => sum + w.prize_amount, 0)
  const pendingAmount = myWinnings.filter(w => w.payment_status === 'pending').reduce((sum, w) => sum + w.prize_amount, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Draws & Prizes</h1>
        <p className="text-cream/50 mt-1 text-sm">Your draw history and winnings</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total won', value: formatAmount(totalWon), color: 'text-gold-400' },
          { label: 'Pending payout', value: formatAmount(pendingAmount), color: 'text-amber-400' },
          { label: 'Draws entered', value: myEntries.length, color: 'text-forest-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center">
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-cream/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {myWinnings.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg font-bold text-cream">My Winnings</h2>
          </div>
          <div className="divide-y divide-white/5">
            {myWinnings.map((winner) => (
              <div key={winner.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${getTierColor(winner.prize_tier)}`}>
                      <Trophy size={10} />
                      {getTierLabel(winner.prize_tier)}
                    </span>
                    <div className="text-xs text-cream/40 mt-2">
                      {(winner.draw as any)?.month && `${getMonthName((winner.draw as any).month)} ${(winner.draw as any).year}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-gold-400">{formatAmount(winner.prize_amount)}</div>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {winner.payment_status === 'paid' ? (
                        <span className="flex items-center gap-1 text-xs text-forest-400"><Check size={12} /> Paid</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400"><Clock size={12} /> Pending</span>
                      )}
                    </div>
                  </div>
                </div>
                {winner.verification_status === 'pending' && !winner.proof_url && (
                  <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
                    <p className="text-xs text-amber-300 mb-2">Upload a screenshot of your scores to verify your win.</p>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-cream/60 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors">
                        <Upload size={12} />
                        {proofFile ? proofFile.name : 'Choose file'}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
                      </label>
                      {proofFile && (
                        <button onClick={() => handleProofUpload(winner.id)} disabled={uploading} className="btn-primary text-xs py-2 px-3 rounded-lg disabled:opacity-50">
                          {uploading ? 'Uploading...' : 'Submit proof'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {winner.proof_url && (
                  <div className="flex items-center gap-1.5 text-xs text-forest-400 mt-2">
                    <Check size={12} /> Proof submitted — under review
                  </div>
                )}
                {winner.verification_status === 'approved' && (
                  <div className="flex items-center gap-1.5 text-xs text-forest-400 mt-2">
                    <Check size={12} /> Verified — payment processing
                  </div>
                )}
                {winner.verification_status === 'rejected' && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 mt-2">
                    <X size={12} /> Verification rejected — {winner.admin_notes || 'contact support'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="font-display text-lg font-bold text-cream">Draw History</h2>
        </div>
        {draws.length === 0 ? (
          <div className="text-center py-12 text-cream/30">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No published draws yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {draws.map((draw) => {
              const myEntry = myEntries.find(e => e.draw_id === draw.id)
              return (
                <div key={draw.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-cream text-sm">{getMonthName(draw.month)} {draw.year}</div>
                      <div className="text-xs text-cream/40 mt-0.5">
                        Pool: {formatAmount(draw.total_pool)} · {draw.participant_count} participants
                      </div>
                    </div>
                    {myEntry ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${myEntry.prize_tier ? getTierColor(myEntry.prize_tier) : 'bg-white/5 text-cream/40'}`}>
                        {myEntry.prize_tier ? getTierLabel(myEntry.prize_tier) : `${myEntry.match_count} matched`}
                      </span>
                    ) : (
                      <span className="text-xs text-cream/30 bg-white/5 px-2 py-1 rounded-full">Not entered</span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {draw.drawn_numbers.map((n) => {
                      const isMatch = myEntry?.scores_snapshot?.includes(n)
                      return (
                        <div key={n} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold transition-all ${isMatch ? 'bg-gold-400 text-charcoal' : 'bg-white/8 text-cream/50'}`}>
                          {n}
                        </div>
                      )
                    })}
                  </div>
                  {myEntry?.scores_snapshot && (
                    <div className="mt-2 text-xs text-cream/30">Your scores: {myEntry.scores_snapshot.join(', ')}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
