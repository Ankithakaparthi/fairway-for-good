'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Subscription } from '@/types'
import { formatDate, formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', handicap: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [profRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*, charity:charities(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      setProfile(profRes.data)
      setSubscription(subRes.data)
      setForm({ full_name: profRes.data?.full_name || '', handicap: profRes.data?.handicap?.toString() || '' })
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      handicap: form.handicap ? parseInt(form.handicap) : null,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else toast.success('Profile updated!')
    setSaving(false)
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the billing period.')) return
    toast('Cancellation request sent. We\'ll process it shortly.', { icon: 'ℹ️' })
    // In production: call Stripe API to cancel subscription
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">Profile</h1>
        <p className="text-cream/50 mt-1 text-sm">Manage your account details</p>
      </div>

      {/* Avatar */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-forest-700 flex items-center justify-center text-2xl font-display font-bold text-cream">
            {profile?.full_name?.[0]?.toUpperCase() || profile?.email[0].toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-display text-xl font-bold text-cream">{profile?.full_name || 'Golfer'}</div>
            <div className="text-sm text-cream/40">{profile?.email}</div>
            <div className="text-xs text-cream/30 mt-1">Member since {profile?.created_at ? formatDate(profile.created_at) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-cream mb-5">Personal details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-cream/60 mb-2">Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="input-dark"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm text-cream/60 mb-2">Email</label>
            <input type="email" value={profile?.email || ''} className="input-dark opacity-50" disabled />
          </div>
          <div>
            <label className="block text-sm text-cream/60 mb-2">Golf handicap <span className="text-cream/30">(optional)</span></label>
            <input
              type="number"
              value={form.handicap}
              onChange={e => setForm({ ...form, handicap: e.target.value })}
              className="input-dark"
              placeholder="e.g. 14"
              min="-10"
              max="54"
            />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Subscription details */}
      {subscription && (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-cream mb-5">Subscription</h2>
          <div className="space-y-3">
            {[
              { label: 'Plan', value: `${subscription.plan} (${formatAmount(subscription.amount_pence / 100)})` },
              { label: 'Status', value: subscription.status, highlight: subscription.status === 'active' },
              { label: 'Charity', value: (subscription.charity as any)?.name || 'Not selected' },
              { label: 'Charity %', value: `${subscription.charity_percentage}%` },
              {
                label: 'Renewal date',
                value: subscription.current_period_end ? formatDate(subscription.current_period_end) : '—'
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-cream/50">{item.label}</span>
                <span className={`text-sm font-medium capitalize ${item.highlight ? 'text-forest-400' : 'text-cream'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {subscription.status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              className="mt-5 text-sm text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Cancel subscription
            </button>
          )}
        </div>
      )}

      {/* Change password */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold text-cream mb-2">Security</h2>
        <p className="text-sm text-cream/50 mb-4">To change your password, we'll send a reset link to your email.</p>
        <button
          onClick={async () => {
            if (!profile?.email) return
            await supabase.auth.resetPasswordForEmail(profile.email)
            toast.success('Password reset email sent!')
          }}
          className="btn-outline text-sm py-2 px-5"
        >
          Send password reset
        </button>
      </div>
    </div>
  )
}
