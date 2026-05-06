import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, MEETING_TYPES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Trash2, CheckSquare } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'
const EMPTY = { meeting_type: 'Leadership Huddle', date: '', attendees: '', agenda: '', key_decisions: '', notes: '' }

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, fontFamily: FONT }}>{label}</label>
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
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, fontFamily: FONT, marginBottom: 8 }}>Action Items</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} placeholder="Action item title" value={item.title} onChange={e => update(i, 'title', e.target.value)} />
              <button onClick={() => remove(i)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} placeholder="Owner" value={item.owner} onChange={e => update(i, 'owner', e.target.value)} />
              <input type="date" className="ksm-input" style={{ minWidth: 130, fontSize: 12, padding: '6px 10px' }} value={item.due_date} onChange={e => update(i, 'due_date', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
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
    const payload = {
      meeting_type: form.meeting_type, date: form.date, attendees: form.attendees || null,
      agenda: form.agenda || null, key_decisions: form.key_decisions || null, notes: form.notes || null
    }
    let meetingId = initial?.id
    if (initial?.id) {
      await supabase.from('meeting_notes').update(payload).eq('id', initial.id)
      await supabase.from('meeting_action_items').delete().eq('meeting_id', initial.id)
    } else {
      const { data } = await supabase.from('meeting_notes').insert(payload).select().single()
      meetingId = data.id
    }
    const validItems = actionItems.filter(a => a.title.trim())
    if (validItems.length > 0) {
      await supabase.from('meeting_action_items').insert(validItems.map(a => ({
        meeting_id: meetingId, title: a.title.trim(), owner: a.owner || null, due_date: a.due_date || null, status: 'Not started'
      })))
    }
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Meeting Type">
          <select className="ksm-input" value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
            {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Date *">
          <input type="date" className="ksm-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
      </div>
      <Field label="Attendees">
        <input className="ksm-input" value={form.attendees || ''} onChange={e => set('attendees', e.target.value)} placeholder="Names, comma-separated" />
      </Field>
      <Field label="Agenda">
        <textarea className="ksm-input" rows={2} value={form.agenda || ''} onChange={e => set('agenda', e.target.value)} placeholder="What will be discussed?" style={{ resize: 'vertical' }} />
      </Field>
      <Field label="Key Decisions">
        <textarea className="ksm-input" rows={3} value={form.key_decisions || ''} onChange={e => set('key_decisions', e.target.value)} placeholder="What was decided?" style={{ resize: 'vertical' }} />
      </Field>
      <Field label="Notes">
        <textarea className="ksm-input" rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Discussion points, context…" style={{ resize: 'vertical' }} />
      </Field>
      <ActionItemEditor items={actionItems} onChange={setActionItems} />
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.date} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function MeetingCard({ meeting, actionItems, onEdit, onDelete, onTaskCreated }) {
  const [expanded, setExpanded] = useState(false)
  const [creatingTask, setCreatingTask] = useState(null)

  async function createTaskFromItem(item) {
    setCreatingTask(item.id)
    await supabase.from('tasks').insert({
      title: item.title,
      category: 'Meeting',
      priority: 'Medium',
      status: 'Not started',
      due_date: item.due_date || null,
      assigned_to: item.owner || null,
      notes: `From ${meeting.meeting_type} on ${formatDate(meeting.date)}`,
    })
    setCreatingTask(null)
    onTaskCreated()
  }

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <button style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{meeting.meeting_type}</span>
            <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: FONT }}>{formatDate(meeting.date)}</span>
          </div>
          {meeting.attendees && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.attendees}</p>}
          {actionItems.length > 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>{actionItems.length} action item{actionItems.length > 1 ? 's' : ''}</p>}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {meeting.agenda && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT, marginBottom: 6 }}>Agenda</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: FONT }}>{meeting.agenda}</p>
            </div>
          )}
          {meeting.key_decisions && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT, marginBottom: 6 }}>Key Decisions</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: FONT }}>{meeting.key_decisions}</p>
            </div>
          )}
          {meeting.notes && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT, marginBottom: 6 }}>Notes</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: FONT }}>{meeting.notes}</p>
            </div>
          )}
          {actionItems.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT, marginBottom: 8 }}>Action Items</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {actionItems.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-base)', borderRadius: 8, padding: '8px 10px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: a.status === 'Done' ? '#22a355' : '#ffa726' }} />
                    <span style={{ flex: 1, fontSize: 12, color: a.status === 'Done' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: a.status === 'Done' ? 'line-through' : 'none', fontFamily: FONT }}>{a.title}</span>
                    {a.owner && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: FONT }}>{a.owner}</span>}
                    {a.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: FONT }}>{formatDate(a.due_date)}</span>}
                    <button onClick={() => createTaskFromItem(a)} disabled={creatingTask === a.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#5a9fd4', background: '#5a9fd418', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                      <CheckSquare size={11} /> {creatingTask === a.id ? '…' : 'Task'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => onEdit(meeting)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
            <button onClick={() => onDelete(meeting.id)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ef535030', color: '#ef5350', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontWeight: 600 }}>Delete</button>
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
  const [taskMsg, setTaskMsg] = useState('')

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

  async function deleteMeeting(id) {
    if (!confirm('Delete this meeting and its action items?')) return
    await supabase.from('meeting_notes').delete().eq('id', id)
    load()
  }

  function handleTaskCreated() {
    setTaskMsg('Task created!')
    setTimeout(() => setTaskMsg(''), 2500)
  }

  const filtered = filterType === 'All' ? meetings : meetings.filter(m => m.meeting_type === filterType)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Meetings</h2>
          <p className="page-subtitle">Ministry meeting log · Action items</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {taskMsg && (
        <div style={{ background: '#22a35518', border: '1px solid #22a35530', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#22a355', fontFamily: FONT }}>{taskMsg}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <select className="ksm-input" style={{ width: 'auto', minWidth: 200 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Meeting Types</option>
          {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0', fontFamily: FONT }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 14, fontFamily: FONT }}>No meetings recorded.</p>
          <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Record your first meeting</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(m => (
            <MeetingCard key={m.id} meeting={m} actionItems={actionItems[m.id] || []} onEdit={m => setModal(m)} onDelete={deleteMeeting} onTaskCreated={handleTaskCreated} />
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{modal === 'new' ? 'Record Meeting' : 'Edit Meeting'}</h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <MeetingForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
