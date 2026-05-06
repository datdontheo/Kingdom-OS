import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, MEETING_TYPES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const EMPTY = { meeting_type: 'Leadership Huddle', date: '', attendees: '', key_decisions: '', notes: '' }

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

function ActionItemEditor({ items, onChange }) {
  function addItem() { onChange([...items, { title: '', owner: '', due_date: '', status: 'Not started' }]) }
  function update(i, k, v) { onChange(items.map((item, idx) => idx === i ? { ...item, [k]: v } : item)) }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)) }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>Action Items</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} placeholder="Action item title" value={item.title} onChange={e => update(i, 'title', e.target.value)} />
              <button onClick={() => remove(i)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} placeholder="Owner" value={item.owner} onChange={e => update(i, 'owner', e.target.value)} />
              <input type="date" className="ksm-input" style={{ minWidth: 130, fontSize: 12, padding: '6px 10px' }} value={item.due_date} onChange={e => update(i, 'due_date', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Plus size={12} /> Add action item
      </button>
    </div>
  )
}

function MeetingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [actionItems, setActionItems] = useState([])
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (initial?.id) supabase.from('meeting_action_items').select('*').eq('meeting_id', initial.id).then(({ data }) => setActionItems(data || []))
  }, [initial])

  async function save() {
    if (!form.date) return
    setSaving(true)
    const payload = { meeting_type: form.meeting_type, date: form.date, attendees: form.attendees, key_decisions: form.key_decisions, notes: form.notes }
    let meetingId = initial?.id
    if (initial?.id) { await supabase.from('meeting_notes').update(payload).eq('id', initial.id); await supabase.from('meeting_action_items').delete().eq('meeting_id', initial.id) }
    else { const { data } = await supabase.from('meeting_notes').insert(payload).select().single(); meetingId = data.id }

    const validItems = actionItems.filter(a => a.title.trim())
    if (validItems.length > 0) {
      await supabase.from('meeting_action_items').insert(validItems.map(a => ({ meeting_id: meetingId, title: a.title.trim(), owner: a.owner || null, due_date: a.due_date || null, status: a.status || 'Not started' })))
      await supabase.from('tasks').insert(validItems.map(a => ({ title: a.title.trim(), category: 'Admin', priority: 'Medium', status: 'Not started', due_date: a.due_date || null, assigned_to: a.owner || null, notes: `From meeting: ${form.meeting_type} on ${form.date}` })))
    }
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Meeting Type"><select className="ksm-input" value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>{MEETING_TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Date *"><input type="date" className="ksm-input" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
      </div>
      <Field label="Attendees"><input className="ksm-input" value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="Names, comma-separated" /></Field>
      <Field label="Key Decisions"><textarea className="ksm-input" rows={3} value={form.key_decisions} onChange={e => set('key_decisions', e.target.value)} placeholder="What was decided?" /></Field>
      <Field label="Notes"><textarea className="ksm-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Discussion points, context…" /></Field>
      <ActionItemEditor items={actionItems} onChange={setActionItems} />
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.date} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function MeetingCard({ meeting, actionItems, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <button className="w-full text-left" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{meeting.meeting_type}</span>
            <span style={{ fontSize: 12, color: 'var(--accent)' }}>{formatDate(meeting.date)}</span>
          </div>
          {meeting.attendees && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">{meeting.attendees}</p>}
          {actionItems.length > 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{actionItems.length} action item{actionItems.length > 1 ? 's' : ''}</p>}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {meeting.key_decisions && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Key Decisions</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{meeting.key_decisions}</p>
            </div>
          )}
          {meeting.notes && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notes</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{meeting.notes}</p>
            </div>
          )}
          {actionItems.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Action Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actionItems.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: a.status === 'Done' ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
                    <span style={{ flex: 1, fontSize: 13, color: a.status === 'Done' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: a.status === 'Done' ? 'line-through' : 'none' }}>{a.title}</span>
                    {a.owner && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{a.owner}</span>}
                    {a.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatDate(a.due_date)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(meeting)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
            <button onClick={() => onDelete(meeting.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [actionItems, setActionItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filterType, setFilterType] = useState('All')

  async function load() {
    const [{ data: m }, { data: a }] = await Promise.all([
      supabase.from('meeting_notes').select('*').order('date', { ascending: false }),
      supabase.from('meeting_action_items').select('*').order('due_date'),
    ])
    setMeetings(m || [])
    setActionItems((a || []).reduce((acc, item) => { acc[item.meeting_id] = acc[item.meeting_id] || []; acc[item.meeting_id].push(item); return acc }, {}))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function deleteMeeting(id) { if (!confirm('Delete this meeting and its action items?')) return; await supabase.from('meeting_notes').delete().eq('id', id); load() }

  const filtered = filterType === 'All' ? meetings : meetings.filter(m => m.meeting_type === filterType)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div><h2 className="page-title">Meeting Notes</h2><p className="page-subtitle">Ministry meeting log & action items</p></div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Plus size={15} /> Add</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="ksm-input" style={{ width: 'auto', minWidth: 200 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Meeting Types</option>
          {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No meetings recorded.</p>
            <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}>Record your first meeting</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(m => <MeetingCard key={m.id} meeting={m} actionItems={actionItems[m.id] || []} onEdit={m => setModal(m)} onDelete={deleteMeeting} />)}
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'new' ? 'Record Meeting' : 'Edit Meeting'} onClose={() => setModal(null)}>
          <MeetingForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
