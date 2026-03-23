'use client'
import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Star, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Charity } from '@/types'
import { formatAmount } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name: '', description: '', long_description: '', image_url: '',
  website_url: '', category: '', is_featured: false, is_active: true,
}

export default function AdminCharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('is_featured', { ascending: false }).order('name')
    setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => { loadCharities() }, [])

  const handleEdit = (charity: Charity) => {
    setEditingId(charity.id)
    setForm({
      name: charity.name,
      description: charity.description || '',
      long_description: charity.long_description || '',
      image_url: charity.image_url || '',
      website_url: charity.website_url || '',
      category: charity.category || '',
      is_featured: charity.is_featured,
      is_active: charity.is_active,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('charities').update(form).eq('id', editingId)
      if (error) toast.error('Failed to update')
      else toast.success('Charity updated!')
    } else {
      const { error } = await supabase.from('charities').insert(form)
      if (error) toast.error('Failed to create')
      else toast.success('Charity added!')
    }
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    loadCharities()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity? This cannot be undone.')) return
    const { error } = await supabase.from('charities').delete().eq('id', id)
    if (error) toast.error('Failed to delete')
    else { toast.success('Deleted'); loadCharities() }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    loadCharities()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Charities</h1>
          <p className="text-cream/50 mt-1 text-sm">{charities.length} registered charities</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM) }} className="btn-gold text-sm py-2 px-5 flex items-center gap-2">
          <Plus size={16} /> Add charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-bold text-cream">{editingId ? 'Edit charity' : 'Add charity'}</h2>
            <button onClick={() => setShowForm(false)} className="text-cream/40 hover:text-cream"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-cream/60 mb-2">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Charity name" />
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Category</label>
              <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-dark" placeholder="e.g. Health, Housing" />
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Image URL</label>
              <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-dark" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-cream/60 mb-2">Website URL</label>
              <input type="url" value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} className="input-dark" placeholder="https://..." />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-gold-400" />
                <span className="text-sm text-cream/70">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-forest-400" />
                <span className="text-sm text-cream/70">Active</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-cream/60 mb-2">Short description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-dark" placeholder="One line summary" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-cream/60 mb-2">Long description</label>
              <textarea value={form.long_description} onChange={e => setForm({ ...form, long_description: e.target.value })} className="input-dark resize-none" rows={3} placeholder="Full charity description..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-outline px-6 py-2.5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 flex items-center gap-2 disabled:opacity-50">
              <Check size={14} /> {saving ? 'Saving...' : 'Save charity'}
            </button>
          </div>
        </div>
      )}

      {/* Charity list */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-forest-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : charities.length === 0 ? (
          <div className="text-center py-12 text-cream/30 text-sm">No charities yet</div>
        ) : (
          <table className="table-dark w-full">
            <thead>
              <tr>
                <th className="text-left">Charity</th>
                <th className="text-left">Category</th>
                <th className="text-right">Raised</th>
                <th className="text-center">Featured</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.map(charity => (
                <tr key={charity.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {charity.image_url && (
                        <img src={charity.image_url} alt={charity.name} className="w-9 h-9 rounded-lg object-cover" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-cream">{charity.name}</div>
                        <div className="text-xs text-cream/40 line-clamp-1 max-w-[200px]">{charity.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-cream/60 text-sm">{charity.category || '—'}</td>
                  <td className="text-right font-display font-bold text-forest-400">{formatAmount(charity.total_raised)}</td>
                  <td className="text-center">
                    <button onClick={() => handleToggleFeatured(charity.id, charity.is_featured)}>
                      <Star size={16} className={charity.is_featured ? 'text-gold-400 fill-gold-400' : 'text-cream/20'} />
                    </button>
                  </td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${charity.is_active ? 'bg-forest-900/50 text-forest-400' : 'bg-red-900/30 text-red-400'}`}>
                      {charity.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(charity)} className="p-1.5 text-cream/40 hover:text-cream hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(charity.id)} className="p-1.5 text-cream/40 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
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
