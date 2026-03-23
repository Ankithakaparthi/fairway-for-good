'use client'
import { useEffect, useState } from 'react'
import { Search, Edit2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingScore, setEditingScore] = useState<{ userId: string; scoreId: string; value: number } | null>(null)

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions(id, plan, status, amount_pence, charity_percentage, charity_id, current_period_end),
        scores(id, score, played_date, course_name)
      `)
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpdateScore = async () => {
    if (!editingScore) return
    const { error } = await supabase
      .from('scores')
      .update({ score: editingScore.value })
      .eq('id', editingScore.scoreId)
    if (error) toast.error('Failed to update score')
    else { toast.success('Score updated'); loadUsers() }
    setEditingScore(null)
  }

  const handleToggleAdmin = async (userId: string, currentValue: boolean) => {
    if (!confirm(`${currentValue ? 'Remove' : 'Grant'} admin access for this user?`)) return
    const { error } = await supabase.from('profiles').update({ is_admin: !currentValue }).eq('id', userId)
    if (error) toast.error('Failed')
    else { toast.success('Updated'); loadUsers() }
  }

  const getActiveSubscription = (u: any) =>
    u.subscriptions?.find((s: any) => s.status === 'active') || u.subscriptions?.[0]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Users</h1>
          <p className="text-cream/50 mt-1 text-sm">{users.length} total members</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-dark pl-11"
          placeholder="Search by name or email..."
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-left">Subscription</th>
                  <th className="text-left">Scores</th>
                  <th className="text-left">Joined</th>
                  <th className="text-center">Admin</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const sub = getActiveSubscription(u)
                  const scores = u.scores || []
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest-800 flex items-center justify-center text-xs text-cream font-medium flex-shrink-0">
                            {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-cream">{u.full_name || '—'}</div>
                            <div className="text-xs text-cream/40">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {sub ? (
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'active' ? 'bg-forest-900/50 text-forest-400' : 'bg-red-900/30 text-red-400'}`}>
                              {sub.status}
                            </span>
                            <div className="text-xs text-cream/40 mt-1 capitalize">{sub.plan} · {formatAmount(sub.amount_pence / 100)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-cream/30">No subscription</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap max-w-[180px]">
                          {scores.length === 0 ? (
                            <span className="text-xs text-cream/30">No scores</span>
                          ) : scores.slice(0, 5).map((sc: any) => (
                            <button
                              key={sc.id}
                              onClick={() => setEditingScore({ userId: u.id, scoreId: sc.id, value: sc.score })}
                              className="text-xs bg-forest-900/40 hover:bg-forest-800/60 text-forest-300 px-2 py-0.5 rounded-md transition-colors font-mono"
                              title={`Edit score ${sc.score} — ${sc.played_date}`}
                            >
                              {sc.score}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="text-cream/50 text-sm">{formatDate(u.created_at)}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${u.is_admin ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-white/5 text-cream/40 hover:bg-white/10'}`}
                        >
                          {u.is_admin ? 'Admin' : 'User'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-cream/30 text-sm">No users found</div>
            )}
          </div>
        )}
      </div>

      {/* Score edit modal */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-cream mb-4">Edit Score</h3>
            <div className="mb-4">
              <label className="block text-sm text-cream/60 mb-2">Score (1–45)</label>
              <input
                type="number"
                min="1"
                max="45"
                value={editingScore.value}
                onChange={e => setEditingScore({ ...editingScore, value: parseInt(e.target.value) })}
                className="input-dark"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingScore(null)} className="btn-outline flex-1 py-2 flex items-center justify-center gap-1"><X size={14} /> Cancel</button>
              <button onClick={handleUpdateScore} className="btn-primary flex-1 py-2 flex items-center justify-center gap-1"><Check size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
