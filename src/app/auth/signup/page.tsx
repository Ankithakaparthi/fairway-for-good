'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Heart, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Charity } from '@/types'
import toast from 'react-hot-toast'

const STEPS = ['Account', 'Your cause', 'Plan']

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    charityId: '',
    charityPercentage: 10,
    plan: 'monthly' as 'monthly' | 'yearly',
  })

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setCharities(data)
    })
  }, [])

  const handleSignup = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (error) throw error

      toast.success('Account created! Redirecting to payment...')
      // In production: redirect to Stripe checkout
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 text-cream/50 hover:text-cream text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i < step ? 'bg-forest-500 text-cream' : i === step ? 'bg-gold-400 text-charcoal' : 'bg-white/10 text-cream/40'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-cream' : 'text-cream/40'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        <div className="glass rounded-3xl p-8">
          {step === 0 && (
            <div>
              <h2 className="font-display text-3xl font-bold text-cream mb-2">Create your account</h2>
              <p className="text-cream/50 text-sm mb-8">Join 24,000+ golfers making a difference</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-cream/60 mb-2">Full name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    className="input-dark"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cream/60 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input-dark"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-cream/60 mb-2">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-dark"
                    placeholder="At least 8 characters"
                  />
                </div>
                <button
                  onClick={() => setStep(1)}
                  disabled={!form.fullName || !form.email || !form.password}
                  className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-3xl font-bold text-cream mb-2">Choose your cause</h2>
              <p className="text-cream/50 text-sm mb-6">At least 10% of your subscription goes here</p>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-1">
                {charities.length === 0 ? (
                  <div className="text-cream/40 text-sm text-center py-8">Loading charities...</div>
                ) : charities.map((charity) => (
                  <button
                    key={charity.id}
                    onClick={() => setForm({ ...form, charityId: charity.id })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      form.charityId === charity.id
                        ? 'border-forest-500 bg-forest-900/40'
                        : 'border-white/10 bg-white/3 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-cream">{charity.name}</div>
                        <div className="text-xs text-cream/50 mt-0.5">{charity.category}</div>
                      </div>
                      {form.charityId === charity.id && (
                        <div className="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-cream/60">Charity contribution</label>
                  <div className="flex items-center gap-1 text-gold-400 font-semibold">
                    <Heart size={14} className="fill-gold-400" />
                    {form.charityPercentage}%
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={form.charityPercentage}
                  onChange={e => setForm({ ...form, charityPercentage: parseInt(e.target.value) })}
                  className="w-full accent-gold-400"
                />
                <div className="flex justify-between text-xs text-cream/30 mt-1">
                  <span>Min 10%</span>
                  <span>Max 50%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline flex-1 py-3 rounded-xl">Back</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.charityId}
                  className="btn-gold flex-1 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-3xl font-bold text-cream mb-2">Choose your plan</h2>
              <p className="text-cream/50 text-sm mb-8">Both plans include full draw access</p>

              <div className="space-y-4 mb-8">
                {[
                  { id: 'monthly', label: 'Monthly', price: '£19.99/mo', note: 'Cancel any time' },
                  { id: 'yearly', label: 'Yearly', price: '£199.90/yr', note: 'Save £40 vs monthly', badge: 'Best value' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setForm({ ...form, plan: p.id as any })}
                    className={`w-full text-left p-5 rounded-xl border transition-all relative ${
                      form.plan === p.id
                        ? 'border-gold-500 bg-gold-900/20'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2.5 right-4 bg-gold-400 text-charcoal text-xs font-semibold px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-cream">{p.label}</div>
                        <div className="text-xs text-cream/50 mt-0.5">{p.note}</div>
                      </div>
                      <div className="font-display font-bold text-cream">{p.price}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="p-4 bg-forest-950/50 rounded-xl border border-forest-800/30 mb-6 text-sm">
                <div className="flex justify-between text-cream/70 mb-2">
                  <span>Plan</span>
                  <span className="text-cream">{form.plan === 'monthly' ? '£19.99/month' : '£199.90/year'}</span>
                </div>
                <div className="flex justify-between text-cream/70 mb-2">
                  <span>Charity donation</span>
                  <span className="text-gold-400">
                    {form.charityPercentage}% → £{form.plan === 'monthly'
                      ? (19.99 * form.charityPercentage / 100).toFixed(2)
                      : (199.90 * form.charityPercentage / 100).toFixed(2)
                    }
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3 rounded-xl">Back</button>
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="btn-gold flex-1 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Pay & start playing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
