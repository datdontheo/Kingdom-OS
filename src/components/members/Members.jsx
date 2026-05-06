import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, daysSince, memberIssueColor, MEMBER_ISSUE_STATUSES } from '../../lib/utils'
import { UserCircle, Plus, X, MessageCircle } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

function Modal({ member, onClose, onSave }) {
  const blank = { name: '', phone_number: '', notes: '', issue_status: 'No issue', last_contact_date: '' }
  const [form, setForm] = useState(member || blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone_number: form.phone_number || null,
      notes: form.notes || null,
      issue_status: form.issue_status,
      last_contact_date: form.last_contact_date || null,
      follow_up_status: 'No action needed',
    }
    if (member?.id) {
      await supabase.from('people').update(payload).eq('id', member.id)
    } else {
      await supabase.from('people').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontFamily: FONT }}>{member?.id ? 'Edit Member' : 'Add Member'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Name *</label>
            <input className="ksm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Member name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Phone Number</label>
            <input className="ksm-input" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+233..." />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Issue Status</label>
            <select className="ksm-input" value={form.issue_status} onChange={e => set('issue_status', e.target.value)}>
              {MEMBER_ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Last Contact Date</label>
            <input className="ksm-input" type="date" value={form.last_contact_date} onChange={e => set('last_contact_date', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea className="ksm-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this member..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : (member?.id ? 'Update' : 'Add Member')}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemberRow({ member, onEdit, onRefresh }) {
  const phone = member.phone_number?.replace(/\D/g, '')
  const waLink = phone ? `https://wa.me/${phone}` : null
  const statusColor = memberIssueColor(member.issue_status || 'No issue')

  async function markContacted() {
    await supabase.from('people').update({ last_contact_date: new Date().toISOString().split('T')[0] }).eq('id', member.id)
    onRefresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: FONT }}>{member.name}</span>
          {member.issue_status && member.issue_status !== 'No issue' && (
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 6, fontFamily: FONT }}>{member.issue_status}</span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>
          {member.last_contact_date ? `Last contact ${daysSince(member.last_contact_date)}d ago · ${formatDate(member.last_contact_date)}` : 'No contact recorded'}
        </p>
        {member.notes && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: FONT }}>{member.notes.slice(0, 60)}{member.notes.length > 60 ? '…' : ''}</p>}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: '#22a35518', color: '#22a355', textDecoration: 'none' }}>
            <MessageCircle size={14} />
          </a>
        )}
        <button onClick={markContacted}
          style={{ fontSize: 11, fontWeight: 600, color: '#5a9fd4', background: '#5a9fd418', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
          Contacted
        </button>
        <button onClick={onEdit}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
          Edit
        </button>
      </div>
    </div>
  )
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('people').select('*').order('name')
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filters = ['All', 'Needs call', 'Escalated', 'No issue', 'Resolved']

  const filtered = members
    .filter(m => filter === 'All' ? true : (m.issue_status || 'No issue') === filter)
    .filter(m => search ? m.name.toLowerCase().includes(search.toLowerCase()) : true)

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Add Member
        </button>
      </div>

      {/* Search */}
      <input className="ksm-input" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search members…" style={{ marginBottom: 12 }} />

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

      <div className="glass-card" style={{ padding: '0 20px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14, padding: '20px 0' }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <UserCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>
              {search ? 'No members match your search.' : members.length === 0 ? 'No members yet. Add your first member.' : `No members with status "${filter}".`}
            </p>
          </div>
        ) : (
          filtered.map(m => <MemberRow key={m.id} member={m} onEdit={() => setModal(m)} onRefresh={load} />)
        )}
      </div>

      {modal !== null && (
        <Modal member={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
