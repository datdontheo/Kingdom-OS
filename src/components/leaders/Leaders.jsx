import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, daysSince, leaderStatusColor, LEADER_FOLLOW_UP_STATUSES } from '../../lib/utils'
import { Users, Plus, X, MessageCircle, Download } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

const ROLES = ['Pastor', 'Worship Leader', 'Admin Officer', 'Media Director', 'Welfare Director', 'Prayer Coordinator', 'Youth Leader', 'Cell Leader', 'Operations', 'Other']

const WHATSAPP_TEMPLATE = (name) =>
  `Hi ${name}, hope you're doing well. Just checking in to know how you are doing and how your area of responsibility is going. Is there anything you need support with?`

function Modal({ leader, onClose, onSave }) {
  const blank = { name: '', role: '', phone_number: '', last_contact_date: '', follow_up_due_date: '', follow_up_status: 'Active', notes: '' }
  const [form, setForm] = useState(leader || blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      role: form.role || null,
      phone_number: form.phone_number || null,
      last_contact_date: form.last_contact_date || null,
      follow_up_due_date: form.follow_up_due_date || null,
      follow_up_status: form.follow_up_status,
      notes: form.notes || null,
    }
    if (leader?.id) {
      await supabase.from('leaders').update(payload).eq('id', leader.id)
    } else {
      await supabase.from('leaders').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontFamily: FONT }}>{leader?.id ? 'Edit Leader' : 'Add Leader'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Name *</label>
            <input className="ksm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Leader name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Role</label>
            <select className="ksm-input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="">Select role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Phone Number</label>
            <input className="ksm-input" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+233..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Last Contact</label>
              <input className="ksm-input" type="date" value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Follow-up Due</label>
              <input className="ksm-input" type="date" value={form.follow_up_due_date} onChange={e => set('follow_up_due_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Follow-up Status</label>
            <select className="ksm-input" value={form.follow_up_status} onChange={e => set('follow_up_status', e.target.value)}>
              {LEADER_FOLLOW_UP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea className="ksm-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this leader..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : (leader?.id ? 'Update' : 'Add Leader')}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderCard({ leader, onEdit, onRefresh }) {
  const [deleting, setDeleting] = useState(false)

  async function markContacted() {
    await supabase.from('leaders').update({ last_contact_date: new Date().toISOString().split('T')[0] }).eq('id', leader.id)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete ${leader.name}?`)) return
    setDeleting(true)
    await supabase.from('leaders').delete().eq('id', leader.id)
    onRefresh()
  }

  const phone = leader.phone_number?.replace(/\D/g, '')
  const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(WHATSAPP_TEMPLATE(leader.name))}` : null
  const statusColor = leaderStatusColor(leader.follow_up_status)

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{leader.name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 6, fontFamily: FONT }}>{leader.follow_up_status}</span>
          </div>
          {leader.role && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>{leader.role}</p>}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: FONT }}>
            {leader.last_contact_date
              ? `Last contact: ${formatDate(leader.last_contact_date)} (${daysSince(leader.last_contact_date)} days ago)`
              : 'Never contacted'}
          </p>
          {leader.follow_up_due_date && (
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2, fontFamily: FONT }}>
              Follow-up due: {formatDate(leader.follow_up_due_date)}
            </p>
          )}
          {leader.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: FONT }}>{leader.notes}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: '#22a35518', color: '#22a355', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              <MessageCircle size={15} />
            </a>
          )}
          <button onClick={onEdit}
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
            Edit
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={markContacted}
          style={{ fontSize: 11, fontWeight: 600, color: '#22a355', background: '#22a35518', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: FONT }}>
          Mark Contacted Today
        </button>
        <button onClick={handleDelete} disabled={deleting}
          style={{ fontSize: 11, fontWeight: 600, color: '#ef5350', background: '#ef535018', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: FONT }}>
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  )
}

function ImportModal({ onClose, onImport }) {
  const [members, setMembers] = useState([])
  const [selected, setSelected] = useState([])
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    supabase.from('people').select('id, name, role, phone_number').order('name')
      .then(({ data }) => setMembers(data || []))
  }, [])

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleImport() {
    if (!selected.length) return
    setImporting(true)
    const toImport = members.filter(m => selected.includes(m.id))
    await supabase.from('leaders').insert(toImport.map(m => ({
      name: m.name,
      role: m.role || null,
      phone_number: m.phone_number || null,
      follow_up_status: 'Active',
    })))
    setImporting(false)
    onImport()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontFamily: FONT }}>Import from Members</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 12 }}>Select members to add to the Leaders list. Their name, role, and phone will be copied.</p>
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {members.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: FONT }}>No members found in your Members list.</p>
            ) : members.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)}
                  style={{ width: 16, height: 16, accentColor: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: FONT }}>{m.name}</p>
                  {m.role && <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT }}>{m.role}</p>}
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn-primary" onClick={handleImport} disabled={importing || !selected.length} style={{ flex: 1 }}>
              {importing ? 'Importing…' : `Import ${selected.length > 0 ? selected.length : ''} Selected`}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Leaders() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [modal, setModal] = useState(null)
  const [showImport, setShowImport] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('leaders').select('*').order('name')
    setLeaders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filters = ['All', 'Active', 'Needs check-in', 'Watching', 'No action needed']

  const filtered = filter === 'All' ? leaders : leaders.filter(l => l.follow_up_status === filter)

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaders</h1>
          <p className="page-subtitle">{leaders.length} leader{leaders.length !== 1 ? 's' : ''} · {leaders.filter(l => l.follow_up_status !== 'No action needed').length} need follow-up</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Download size={14} /> Import
          </button>
          <button className="btn-primary" onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Add Leader
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>Loading leaders…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>
            {filter === 'All' ? 'No leaders yet. Add your first leader to start tracking follow-ups.' : `No leaders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(l => (
            <LeaderCard key={l.id} leader={l} onEdit={() => setModal(l)} onRefresh={load} />
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal leader={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={() => { setShowImport(false); load() }} />
      )}
    </div>
  )
}
