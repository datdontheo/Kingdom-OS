import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, daysSince, isOverdue, FOLLOW_UP_STATUSES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react'

const EMPTY = { name: '', role: '', phone_number: '', last_contact_date: '', notes: '', follow_up_status: 'Active', follow_up_due_date: '' }

function Badge({ text }) {
  const styles = {
    Active: { color: 'var(--accent-green)', border: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.08)' },
    Watching: { color: 'var(--accent-amber)', border: 'rgba(251,191,36,0.3)', bg: 'rgba(251,191,36,0.08)' },
    'No action needed': { color: 'var(--text-muted)', border: 'var(--border)', bg: 'transparent' },
  }
  const s = styles[text] || styles['No action needed']
  return (
    <span className="badge" style={{ color: s.color, borderColor: s.border, background: s.bg }}>
      {text}
    </span>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function PersonForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), role: form.role, phone_number: form.phone_number || null, last_contact_date: form.last_contact_date || null, notes: form.notes, follow_up_status: form.follow_up_status, follow_up_due_date: form.follow_up_due_date || null }
    if (initial?.id) await supabase.from('people').update(payload).eq('id', initial.id)
    else await supabase.from('people').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Name *"><input className="ksm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" /></Field>
      <Field label="Role / Relationship"><input className="ksm-input" value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Director of Finance, Pod Leader" /></Field>
      <Field label="WhatsApp / Phone Number"><input className="ksm-input" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+233244123456" /></Field>
      <Field label="Last Contact Date"><input type="date" className="ksm-input" value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Follow-up Status">
          <select className="ksm-input" value={form.follow_up_status} onChange={e => set('follow_up_status', e.target.value)}>
            {FOLLOW_UP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Follow-up Due Date"><input type="date" className="ksm-input" value={form.follow_up_due_date} onChange={e => set('follow_up_due_date', e.target.value)} /></Field>
      </div>
      <Field label="Notes"><textarea className="ksm-input" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Pastoral notes, context, prayer points…" /></Field>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function PersonCard({ person, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const ds = person.last_contact_date ? daysSince(person.last_contact_date) : null
  const overdue = person.follow_up_due_date ? isOverdue(person.follow_up_due_date) : (ds !== null && ds > 14)
  const waLink = person.phone_number ? `https://wa.me/${person.phone_number.replace(/\D/g, '')}` : null

  return (
    <div className="glass-card" style={{ overflow: 'hidden', borderColor: overdue ? 'rgba(248,113,113,0.3)' : undefined }}>
      <button className="w-full text-left" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setExpanded(!expanded)}>
        {/* Avatar */}
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-dim), rgba(96,165,250,0.1))', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
          {person.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{person.name}</span>
            <Badge text={person.follow_up_status} />
            {overdue && <span style={{ fontSize: 11, color: 'var(--accent-red)', fontWeight: 500 }}>⚠ Overdue</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{person.role || 'No role set'}</p>
          {person.last_contact_date && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Last contact {formatDate(person.last_contact_date)}{ds !== null ? ` · ${ds}d ago` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              style={{ color: 'var(--accent-green)', padding: 4 }}
              title="Open WhatsApp">
              <MessageCircle size={16} />
            </a>
          )}
          {expanded ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {person.phone_number && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>📞 {person.phone_number}</p>
          )}
          {person.follow_up_due_date && (
            <p style={{ fontSize: 12, color: 'var(--accent-amber)', marginTop: 8 }}>Follow-up due: {formatDate(person.follow_up_due_date)}</p>
          )}
          {person.notes && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{person.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(person)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
            <button onClick={() => onDelete(person.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
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
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.role || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || p.follow_up_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">People</h2>
          <p className="page-subtitle">Pastoral directory & follow-up tracker</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={15} /> Add
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="ksm-input" style={{ paddingLeft: 32 }} placeholder="Search name or role…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="ksm-input" style={{ width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {FOLLOW_UP_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14 }}>No people found.</p>
          <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first person</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => <PersonCard key={p.id} person={p} onEdit={p => setModal(p)} onDelete={deletePerson} />)}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Person' : 'Edit Person'} onClose={() => setModal(null)}>
          <PersonForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
