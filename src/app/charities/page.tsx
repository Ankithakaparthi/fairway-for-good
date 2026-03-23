'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Heart, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Charity } from '@/types'
import { formatAmount } from '@/lib/utils'

const CATEGORIES = ['All', 'Health', 'Housing', 'Mental Health', 'Social Care', 'Education', 'Environment']

export default function CharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }).then(({ data }) => {
      setCharities(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === 'All' || c.category === category
    return matchSearch && matchCategory
  })

  const featured = filtered.filter(c => c.is_featured)
  const regular = filtered.filter(c => !c.is_featured)

  return (
    <div className="min-h-screen hero-bg">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-cream/50 hover:text-cream text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cream mb-3">Our charity partners</h1>
          <p className="text-cream/60 text-lg max-w-xl">Every pound you contribute goes directly to causes that change lives. Choose yours when you subscribe.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark pl-10"
              placeholder="Search charities..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-sm px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${category === cat ? 'bg-forest-700 text-cream' : 'bg-white/5 text-cream/50 hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs uppercase tracking-widest text-gold-400 font-medium">Featured</span>
                  <div className="flex-1 h-px bg-gold-900/30" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {featured.map(charity => (
                    <CharityCard key={charity.id} charity={charity} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regular.map(charity => (
                <CharityCard key={charity.id} charity={charity} />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-cream/30">
                <Heart size={40} className="mx-auto mb-4 opacity-30" />
                <p>No charities found</p>
              </div>
            )}
          </>
        )}

        <div className="mt-16 text-center">
          <p className="text-cream/50 mb-4">Ready to start making a difference?</p>
          <Link href="/auth/signup" className="btn-gold text-base px-8 py-3">Join now →</Link>
        </div>
      </div>
    </div>
  )
}

function CharityCard({ charity, featured }: { charity: Charity; featured?: boolean }) {
  return (
    <div className={`glass rounded-2xl overflow-hidden hover:border-white/15 transition-all group ${featured ? 'glass-gold' : ''}`}>
      {charity.image_url && (
        <div className="h-44 overflow-hidden">
          <img
            src={charity.image_url}
            alt={charity.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-display text-lg font-bold text-cream">{charity.name}</h3>
            <span className="text-xs text-cream/40">{charity.category}</span>
          </div>
          {charity.website_url && (
            <a href={charity.website_url} target="_blank" rel="noopener noreferrer" className="text-cream/30 hover:text-cream/60 transition-colors ml-2">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <p className="text-sm text-cream/60 leading-relaxed line-clamp-3 mb-4">{charity.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-forest-400">
            <Heart size={12} className="fill-forest-400" />
            <span className="font-medium">{formatAmount(charity.total_raised)}</span>
            <span className="text-cream/30">raised</span>
          </div>
          <Link href="/auth/signup" className="text-xs text-gold-400 hover:text-gold-300 transition-colors font-medium">
            Support this →
          </Link>
        </div>
      </div>
    </div>
  )
}
