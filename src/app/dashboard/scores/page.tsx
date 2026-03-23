'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Info, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Score } from '@/types'
import { formatDate, getScoreColor, getScoreLabel } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ScoresPage() {
  const supabase = createClient()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    score: '',
    played_date: new Date().toISOString().split('T')[0],
    course_name: '',
    notes: '',
  })

  const loadScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })
    setScores(data || [])
    setLoading(false)
  }

  useEffect(() => { loadScores() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const scoreNum = parseInt(form.score)
    if (scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be between 1 and 45')
      return
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreNum,
      played_date: form.played_date,
      course_name: form.course_name || null,
      notes: form.notes || null,
    })

    if (error) {
      toast.error('Failed to add score')
    } else {
      toast.success('Score added!')
      setForm({ score: '', played_date: new Date().toISOString().split('T')[0], course_name: '', notes: '' })
      setShowForm(false)
      loadScores()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this score?')) return
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (error) {
      toast.error('Failed to remove score')
    } else {
      toast.success('Score removed')
      loadScores()
    }
  }

  const avgScore = scores.length ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">My Scores</h1>
          <p className="text-cream/50 mt-1 text-sm">Your last 5 Stableford rounds</p>
        </div>
        {scores.length < 5 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-gold text-sm py-2 px-4 flex items-center gap-2"
          >
            <Plus size={16} /> Add score
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-forest-950/50 border border-forest-800/30 rounded-xl">
        <Info size={16} className="text-forest-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-cream/60">
          Only your latest 5 scores are kept. Adding a 6th automatically removes your oldest. 
          Your scores form your draw entry numbers — scores 1–45 are valid Stableford values.
        </p>
      </div>

      {/* Add score form */}
      {showForm && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-cream mb-5">Add a score</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-cream/60 mb-2">
                  Stableford score <span className="text-cream/30">(1–45)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={form.score}
                  onChange={e => setForm({ ...form, score: e.target.value })}
                  className="input-dark"
                  placeholder="e.g. 32"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cream/60 mb-2">Date played</label>
                <input
                  type="date"
                  value={form.played_date}
                  onChange={e => setForm({ ...form, played_date: e.target.value })}
                  className="input-dark"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Course name <span className="text-cream/30">(optional)</span></label>
              <input
                type="text"
                value={form.course_name}
                onChange={e => setForm({ ...form, course_name: e.target.value })}
                className="input-dark"
                placeholder="e.g. Royal Birkdale"
              />
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Notes <span className="text-cream/30">(optional)</span></label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="input-dark resize-none"
                rows={2}
                placeholder="Conditions, highlights..."
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add score'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Score slots */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium text-cream/70">Score history</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-cream/40">{scores.length}/5 slots</span>
            {scores.length === 5 && (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">Full</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16">
            <Star size={40} className="text-cream/15 mx-auto mb-4" />
            <p className="text-cream/40 mb-2">No scores yet</p>
            <p className="text-cream/25 text-sm">Add your first Stableford score to enter draws</p>
          </div>
        ) : (
          <div>
            {scores.map((score, i) => (
              <div key={score.id} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-forest-900/60 flex items-center justify-center text-xs text-cream/50 flex-shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-cream text-sm truncate">
                    {score.course_name || 'Golf course'}
                  </div>
                  <div className="text-xs text-cream/40 mt-0.5">{formatDate(score.played_date)}</div>
                  {score.notes && (
                    <div className="text-xs text-cream/30 mt-0.5 truncate">{score.notes}</div>
                  )}
                </div>
                <div className="text-right mr-2">
                  <div className={`font-display text-2xl font-bold ${getScoreColor(score.score)}`}>
                    {score.score}
                  </div>
                  <div className={`text-xs ${getScoreColor(score.score)} opacity-70`}>
                    {getScoreLabel(score.score)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(score.id)}
                  className="opacity-0 group-hover:opacity-100 text-cream/30 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {/* Average row */}
            {scores.length > 1 && (
              <div className="flex items-center justify-between px-6 py-3 bg-forest-950/40">
                <span className="text-xs text-cream/40 uppercase tracking-wider">Average score</span>
                <span className={`font-display text-xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</span>
              </div>
            )}
          </div>
        )}

        {/* Empty slots */}
        {!loading && Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0 opacity-30">
            <div className="w-8 h-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-xs text-cream/30">
              #{scores.length + i + 1}
            </div>
            <div className="text-sm text-cream/30 italic">Empty slot</div>
          </div>
        ))}
      </div>

      {/* Draw eligibility */}
      <div className={`rounded-2xl p-5 border ${scores.length >= 3 ? 'bg-forest-900/30 border-forest-700/30' : 'bg-amber-900/20 border-amber-700/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${scores.length >= 3 ? 'bg-forest-400' : 'bg-amber-400'}`} />
          <div>
            <div className="text-sm font-medium text-cream">
              {scores.length >= 3
                ? `✓ Draw eligible — ${scores.length} scores registered`
                : `${3 - scores.length} more score${3 - scores.length === 1 ? '' : 's'} needed for draw entry`}
            </div>
            <div className="text-xs text-cream/40 mt-0.5">
              Minimum 3 scores required. More scores = better match chances.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
