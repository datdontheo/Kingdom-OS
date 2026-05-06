import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, daysSince, isOverdue, FOLLOW_UP_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Search } from 'lucide-react'

const EMPTY = {
  name: '', role: '', last_contact_date: '', notes: '',
  follow_up_status: 'Active', follow_up_due_date: ''
}

function Badge({ text }) {
  const colors = {
    Active: 'bg-green-950/50 text-green-300 border-green-800/40',
    Watching: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
    'No action needed': 'bg-gray-800/60 text-gray-400 border-gray-700/40',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[text] || colors['No action needed']}`}>
      {text}
    </span>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700/60 rounded-2xl w-full max-w-lg max-h-[90svh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-600/60'
const selectCls = inputCls + ' cursor-pointer'

function PersonForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      role: form.role,
      last_contact_date: form.last_contact_date || null,
      notes: form.notes,
      follow_up_status: form.follow_up_status,
      follow_up_due_date: form.follow_up_due_date || null,
    }
    if (initial?.id) {
      await supabase.from('people').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('people').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-4">
      <Field label="Name *">
        <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" />
      </Field>
      <Field label="Role / Relationship">
        <input className={inputCls} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Director of Finance, Pod Leader" />
      </Field>
      <Field label="Last Contact Date">
        <input type="date" className={inputCls} value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)} />
      </Field>
      <Field label="Follow-up Status">
        <select className={selectCls} value={form.follow_up_status} onChange={e => set('follow_up_status', e.target.value)}>
          {FOLLOW_UP_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Follow-up Due Date">
        <input type="date" className={inputCls} value={form.follow_up_due_date} onChange={e => set('follow_up_due_date', e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls} rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Pastoral notes, context, prayer points…" />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
        <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function PersonCard({ person, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const ds = person.last_contact_date ? daysSince(person.last_contact_date) : null
  const overdue = person.follow_up_due_date ? isOverdue(person.follow_up_due_date) : (ds !== null && ds > 14)

  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl overflow-hidden">
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">{person.name}</span>
            <Badge text={person.follow_up_status} />
            {overdue && <span className="text-xs text-red-400">⚠ Follow-up overdue</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{person.role || 'No role set'}</p>
          {person.last_contact_date && (
            <p className="text-xs text-gray-600 mt-0.5">
              Last contact {formatDate(person.last_contact_date)}
              {ds !== null ? ` · ${ds}d ago` : ''}
            </p>
          )}
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-500 mt-0.5 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 mt-0.5 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/40">
          {person.follow_up_due_date && (
            <p className="text-xs text-amber-400 mt-3">Follow-up due: {formatDate(person.follow_up_due_date)}</p>
          )}
          {person.notes && (
            <p className="text-sm text-gray-400 mt-3 leading-relaxed whitespace-pre-wrap">{person.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(person)} className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-800/40 hover:bg-violet-950/30">Edit</button>
            <button onClick={() => onDelete(person.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-900/40 hover:bg-red-950/30">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function People() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  async function load() {
    const { data } = await supabase.from('people').select('*').order('name')
    setPeople(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deletePerson(id) {
    if (!confirm('Delete this person?')) return
    await supabase.from('people').delete().eq('id', id)
    load()
  }

  const filtered = people.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.role || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || p.follow_up_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">People</h2>
          <p className="text-xs text-gray-500 mt-0.5">Pastoral directory & follow-up tracker</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-sm px-3 py-2 rounded-lg font-medium">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className={inputCls + ' pl-8'}
            placeholder="Search name or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-2 text-sm text-gray-300 focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>All</option>
          {FOLLOW_UP_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No people found.</p>
          <button onClick={() => setModal('new')} className="text-violet-400 text-sm mt-2 hover:underline">Add your first person</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PersonCard key={p.id} person={p} onEdit={p => setModal(p)} onDelete={deletePerson} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Person' : 'Edit Person'} onClose={() => setModal(null)}>
          <PersonForm
            initial={modal === 'new' ? null : modal}
            onSave={() => { setModal(null); load() }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
