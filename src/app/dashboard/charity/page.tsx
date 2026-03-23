'use client'
import { useEffect, useState } from 'react'
import { Heart, ExternalLink, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Charity, Subscription } from '@/types'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CharityPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(10)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [charRes, subRes] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }),
        supabase.from('subscriptions').select('*, charity:charities(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      setCharities(charRes.data || [])
      if (subRes.data) {
        setSubscription(subRes.data)
        setSelectedId(subRes.data.charity_id || '')
        setPercentage(subRes.data.charity_percentage || 10)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!subscription) return
    setSaving(true)
    const { error } = await supabase
      .from('subscriptions')
      .update({ charity_id: selectedId, charity_percentage: percentage })
      .eq('id', subscription.id)
    if (error) {
      toast.error('Failed to update charity preference')
    } else {
      toast.success('Charity preference updated!')
    }
    setSaving(false)
  }

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  const monthlyDonation = subscription
    ? (subscription.amount_pence / 100) * (percentage / 100)
    : (19.99 * percentage / 100)

  const selected = charities.find(c => c.id === selectedId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">My Charity</h1>
        <p className="text-cream/50 mt-1 text-sm">Choose who benefits from your subscription</p>
      </div>

      {/* Current donation card */}
      {subscription && (
        <div className="glass-gold rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart size={20} className="text-gold-400 fill-gold-400" />
            <h2 className="font-display text-lg font-bold text-cream">Your contribution</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-cream/40 mb-1">Charity</div>
              <div className="text-sm font-medium text-cream">{selected?.name || 'Not selected'}</div>
            </div>
            <div>
              <div className="text-xs text-cream/40 mb-1">Percentage</div>
              <div className="text-sm font-medium text-gold-400">{percentage}%</div>
            </div>
            <div>
              <div className="text-xs text-cream/40 mb-1">Monthly amount</div>
              <div className="text-sm font-medium text-gold-400">{formatAmount(monthlyDonation)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution slider */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-cream mb-4">Adjust contribution</h2>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-cream/60">Charity percentage</label>
          <div className="flex items-center gap-1 text-gold-400 font-bold text-lg font-display">
            <Heart size={14} className="fill-gold-400" />
            {percentage}%
          </div>
        </div>
        <input
          type="range"
          min="10"
          max="50"
          step="5"
          value={percentage}
          onChange={e => setPercentage(parseInt(e.target.value))}
          className="w-full accent-gold-400 mb-3"
        />
        <div className="flex justify-between text-xs text-cream/30">
          <span>Minimum 10%</span>
          <span>Maximum 50%</span>
        </div>
        <div className="mt-4 p-3 bg-forest-950/50 rounded-xl text-sm text-cream/60">
          At {percentage}%, you'll donate <span className="text-gold-400 font-semibold">{formatAmount(monthlyDonation)}</span> per month to your chosen charity.
        </div>
      </div>

      {/* Charity selector */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-display text-lg font-bold text-cream mb-4">Choose a charity</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark pl-9"
              placeholder="Search charities..."
            />
          </div>
        </div>

        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
          {filtered.map((charity) => (
            <button
              key={charity.id}
              onClick={() => setSelectedId(charity.id)}
              className={`w-full text-left p-5 flex items-start gap-4 hover:bg-white/3 transition-colors ${
                selectedId === charity.id ? 'bg-forest-900/30' : ''
              }`}
            >
              {charity.image_url && (
                <img
                  src={charity.image_url}
                  alt={charity.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cream text-sm">{charity.name}</span>
                  {charity.is_featured && (
                    <span className="text-xs bg-gold-900/40 text-gold-400 px-2 py-0.5 rounded-full">Featured</span>
                  )}
                </div>
                <div className="text-xs text-cream/40 mt-0.5">{charity.category}</div>
                <div className="text-xs text-cream/50 mt-1 line-clamp-2">{charity.description}</div>
                <div className="text-xs text-forest-400 mt-1">
                  {formatAmount(charity.total_raised)} raised
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                selectedId === charity.id
                  ? 'bg-forest-500 border-forest-500'
                  : 'border-white/20'
              }`}>
                {selectedId === charity.id && <Check size={12} className="text-white" />}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-cream/30 text-sm">No charities found</div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !selectedId}
          className="btn-gold px-8 py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {/* Charity events */}
      {selected?.upcoming_events && selected.upcoming_events.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-cream mb-4">Upcoming events — {selected.name}</h2>
          <div className="space-y-3">
            {selected.upcoming_events.map((ev: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 bg-white/3 rounded-xl">
                <div className="text-center min-w-[3rem]">
                  <div className="text-gold-400 font-bold text-lg font-display leading-none">
                    {new Date(ev.date).getDate()}
                  </div>
                  <div className="text-xs text-cream/40">
                    {new Date(ev.date).toLocaleString('en-GB', { month: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-cream">{ev.title}</div>
                  <div className="text-xs text-cream/50 mt-0.5">{ev.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
