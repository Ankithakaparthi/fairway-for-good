'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Heart, Trophy, Target, ChevronRight, Star, ArrowRight } from 'lucide-react'

const CHARITIES = [
  { name: 'Cancer Research UK', raised: '£2.4M', category: 'Health' },
  { name: 'Macmillan Cancer Support', raised: '£1.8M', category: 'Health' },
  { name: 'Mental Health Foundation', raised: '£960K', category: 'Wellbeing' },
  { name: 'Shelter', raised: '£1.1M', category: 'Housing' },
  { name: 'Age UK', raised: '£740K', category: 'Social Care' },
]

const STATS = [
  { value: '£7.2M+', label: 'Raised for charity' },
  { value: '24,000+', label: 'Active golfers' },
  { value: '£180K', label: 'Monthly prize pool' },
  { value: '47', label: 'Charity partners' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Target size={24} />,
    title: 'Subscribe & choose your cause',
    desc: 'Pick monthly or yearly. A portion of every subscription goes directly to the charity you choose.',
  },
  {
    step: '02',
    icon: <Star size={24} />,
    title: 'Enter your Stableford scores',
    desc: 'Log your last 5 rounds. Your scores become your draw entries — the better you play, the more interesting your numbers.',
  },
  {
    step: '03',
    icon: <Trophy size={24} />,
    title: 'Win monthly prizes',
    desc: 'Match 3, 4, or all 5 numbers in our monthly draw. Jackpots roll over until someone wins.',
  },
]

export default function HomePage() {
  const [activeCharity, setActiveCharity] = useState(0)
  const [counter, setCounter] = useState({ raised: 0, golfers: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCharity(p => (p + 1) % CHARITIES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen hero-bg overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 glass">
        <Link href="/" className="font-display text-xl font-bold text-cream tracking-tight">
          Fairway <span className="text-gold-400">for Good</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-cream/70">
          <Link href="/charities" className="hover:text-cream transition-colors">Charities</Link>
          <Link href="/how-it-works" className="hover:text-cream transition-colors">How It Works</Link>
          <Link href="/draws" className="hover:text-cream transition-colors">Draws</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-outline text-sm py-2 px-5">Sign in</Link>
          <Link href="/auth/signup" className="btn-gold text-sm py-2 px-5">Join now</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Decorative orbs */}
        <div className="absolute top-24 right-12 w-96 h-96 bg-forest-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-48 right-48 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-forest-950/60 border border-forest-700/40 rounded-full px-4 py-2 mb-8">
            <Heart size={14} className="text-gold-400 fill-gold-400" />
            <span className="text-sm text-cream/80">£7.2M raised for charity since 2021</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-cream leading-none mb-6">
            Golf that
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-forest-400 to-gold-400">
              changes lives.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-cream/70 leading-relaxed mb-10 max-w-xl">
            Subscribe. Enter your scores. Win monthly prizes. And every round you play sends real money to the charities that need it most.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-16">
            <Link href="/auth/signup" className="btn-gold text-base px-8 py-4 rounded-xl flex items-center gap-2">
              Start making a difference <ArrowRight size={18} />
            </Link>
            <Link href="/charities" className="flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm">
              Browse our charities <ChevronRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-5">
                <div className="font-display text-2xl md:text-3xl font-bold text-gold-400 mb-1">{stat.value}</div>
                <div className="text-xs text-cream/50 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rotating charity ticker */}
      <section className="py-6 border-y border-white/5 overflow-hidden">
        <div className="flex items-center gap-6 px-6 md:px-12">
          <span className="text-xs uppercase tracking-widest text-cream/40 whitespace-nowrap">
            Current beneficiaries
          </span>
          <div className="flex gap-6 overflow-hidden flex-1">
            <div className="flex gap-8 animate-pulse-slow">
              {CHARITIES.map((c) => (
                <span key={c.name} className="text-sm text-cream/60 whitespace-nowrap flex items-center gap-2">
                  <Heart size={12} className="text-gold-400 fill-gold-400" />
                  {c.name}
                  <span className="text-forest-400 font-medium">{c.raised}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream mb-4">
            Simple as a birdie.
          </h2>
          <p className="text-cream/60 text-lg max-w-lg mx-auto">
            Three steps between you and making a real difference.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className="glass rounded-3xl p-8 relative overflow-hidden group hover:border-forest-700/40 transition-all duration-300"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="absolute top-4 right-6 font-display text-7xl font-bold text-white/3 select-none">
                {item.step}
              </div>
              <div className="w-12 h-12 bg-forest-800/60 rounded-2xl flex items-center justify-center text-forest-400 mb-6 group-hover:bg-forest-700/60 transition-colors">
                {item.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-cream mb-3">{item.title}</h3>
              <p className="text-cream/60 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize pool visual */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="glass-gold rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-medium mb-4">
                <Trophy size={16} />
                This month's prize pool
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-cream mb-6">
                £18,400
                <span className="text-gold-400">.</span>
              </h2>
              <p className="text-cream/60 mb-8 leading-relaxed">
                Every subscriber contributes to the pool. Match more numbers, win more. 
                The jackpot rolls over every month it goes unclaimed.
              </p>
              <Link href="/auth/signup" className="btn-gold inline-flex items-center gap-2">
                Enter this month's draw <ArrowRight size={16} />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { label: '5-Number Match', pct: 40, amount: '£7,360', color: 'bg-gold-400' },
                { label: '4-Number Match', pct: 35, amount: '£6,440', color: 'bg-forest-400' },
                { label: '3-Number Match', pct: 25, amount: '£4,600', color: 'bg-forest-600' },
              ].map((tier) => (
                <div key={tier.label} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-cream/70">{tier.label}</span>
                    <span className="font-display text-lg font-bold text-cream">{tier.amount}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tier.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${tier.pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-cream/40 mt-2">{tier.pct}% of total pool</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto" id="pricing">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream mb-4">
            One simple price.
          </h2>
          <p className="text-cream/60 text-lg">No hidden fees. Cancel any time.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              plan: 'Monthly',
              price: '£19.99',
              period: '/month',
              features: ['Full draw participation', 'Unlimited score entry', 'Choose your charity', 'Monthly prize eligibility'],
              cta: 'Start monthly',
              highlight: false,
            },
            {
              plan: 'Yearly',
              price: '£199.90',
              period: '/year',
              badge: 'Save £40',
              features: ['Everything in Monthly', 'Priority draw entry', 'Annual charity report', 'Exclusive member events'],
              cta: 'Start yearly',
              highlight: true,
            },
          ].map((plan) => (
            <div
              key={plan.plan}
              className={`rounded-3xl p-8 relative ${plan.highlight ? 'glass-gold border border-gold-600/30' : 'glass'}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-8 bg-gold-400 text-charcoal text-xs font-semibold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="text-sm text-cream/50 uppercase tracking-widest mb-4">{plan.plan}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-display text-4xl font-bold text-cream">{plan.price}</span>
                <span className="text-cream/40 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-cream/70">
                    <div className="w-4 h-4 rounded-full bg-forest-700 flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3l2 2 4-4" stroke="#5f9762" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className={`w-full text-center block py-3 px-6 rounded-xl font-medium text-sm transition-all ${
                  plan.highlight ? 'btn-gold' : 'btn-outline'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display text-lg font-bold text-cream">
            Fairway <span className="text-gold-400">for Good</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-cream/40">
            <Link href="/privacy" className="hover:text-cream/70 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-cream/70 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-cream/70 transition-colors">Contact</Link>
          </div>
          <div className="text-sm text-cream/30">
            © 2024 Fairway for Good. Registered charity: 12345678
          </div>
        </div>
      </footer>
    </div>
  )
}
