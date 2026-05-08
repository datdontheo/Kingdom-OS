import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, today, MEETING_TYPES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Trash2, CheckSquare, Calendar, Users, Clock, Edit2 } from 'lucide-react'

const TYPE_COLORS = {
  'Leadership Huddle': '#5a9fd4',
  'One-on-One': '#22a355',
  'Planning Meeting': '#8b5cf6',
  'Discipleship Meeting': '#b89b38',
  'Event Meeting': '#ffa726',
  'Other': '#6b7280',
}
const typeColor = (t) => TYPE_COLORS[t] || '#6b7280'

const EMPTY = { meeting_type: 'Leadership Huddle', date: '', time: '', attendees: '', agenda: '', key_decisions: '', notes: '' }

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</label>
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
      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 8 }}>Action Items</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 13, padding: '7px 10px' }} placeholder="Action item…" value={item.title} onChange={e => update(i, 'title', e.target.value)} />
              <button onClick={() => remove(i)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef5350'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Trash2 size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ksm-input" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} placeholder="Owner" value={item.owner} onChange={e => update(i, 'owner', e.target.value)} />
              <input type="date" className="ksm-input" style={{ minWidth: 140, fontSize: 12, padding: '6px 10px' }} value={item.due_date} onChange={e => update(i, 'due_date', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} style={{ marginTop: 10, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
        <Plus size={13} /> Add action item
      </button>
    </div>
  )
}

function MeetingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ? { ...initial, time: initial.time || '' } : EMPTY)
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
      meeting_type: form.meeting_type,
      date: form.date,
      time: form.time || null,
      attendees: form.attendees || null,
      agenda: form.agenda || null,
      key_decisions: form.key_decisions || null,
      notes: form.notes || null,
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
        meeting_id: meetingId, title: a.title.trim(), owner: a.owner || null, due_date: a.due_date || null, status: 'Not started',
      })))
    }
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <Field label="Time">
        <input type="time" className="ksm-input" value={form.time || ''} onChange={e => set('time', e.target.value)} />
      </Field>
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
        <button onClick={save} disabled={saving || !form.date} className="btn-primary" style={{ flex: 1 }}>
          {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Log Meeting'}
        </button>
      </div>
    </div>
  )
}

function MeetingCard({ meeting, actionItems, onEdit, onDelete, onTaskCreated }) {
  const [expanded, setExpanded] = useState(false)
  const [creatingTask, setCreatingTask] = useState(null)
  const color = typeColor(meeting.meeting_type)
  const pendingItems = actionItems.filter(a => a.status !== 'Done')
  const doneItems = actionItems.filter(a => a.status === 'Done')

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
    <div className="glass-card" style={{ overflow: 'hidden', padding: 0, borderLeft: `3px solid ${color}` }}>
      {/* Card header — always visible */}
      <button
        style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {meeting.meeting_type}
            </span>
            {pendingItems.length > 0 && (
              <span style={{ fontSize: 11, color: '#ffa726', background: '#ffa72618', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                {pendingItems.length} pending
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
              <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
              {formatDate(meeting.date)}
            </span>
            {meeting.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <Clock size={12} /> {meeting.time}
              </span>
            )}
          </div>
          {meeting.attendees && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              <Users size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meeting.attendees}</span>
            </p>
          )}
        </div>
        {expanded
          ? <ChevronUp size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
          : <ChevronDown size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Agenda', value: meeting.agenda },
            { label: 'Key Decisions', value: meeting.key_decisions },
            { label: 'Notes', value: meeting.notes },
          ].filter(s => s.value).map(({ label, value }) => (
            <div key={label} style={{ marginTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{value}</p>
            </div>
          ))}

          {actionItems.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Action Items
                {doneItems.length > 0 && <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#22a355' }}>{doneItems.length} done</span>}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actionItems.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-base)', borderRadius: 8, padding: '8px 12px', border: '1px solid var(--border)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: a.status === 'Done' ? '#22a355' : '#ffa726' }} />
                    <span style={{ flex: 1, fontSize: 13, color: a.status === 'Done' ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: a.status === 'Done' ? 'line-through' : 'none', lineHeight: 1.4 }}>{a.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {a.owner && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.owner}</span>}
                      {a.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(a.due_date)}</span>}
                      <button onClick={() => createTaskFromItem(a)} disabled={creatingTask === a.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#5a9fd4', background: '#5a9fd418', border: '1px solid #5a9fd430', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>
                        <CheckSquare size={11} /> {creatingTask === a.id ? '…' : 'Task'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => onEdit(meeting)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(meeting.id)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ef535030', color: '#ef5350', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              Delete
            </button>
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
  const [filter, setFilter] = useState('All')
  const [taskMsg, setTaskMsg] = useState('')
  const todayStr = today()

  async function load() {
    const [{ data: m }, { data: a }] = await Promise.all([
      supabase.from('meeting_notes').select('*').order('date', { ascending: false }),
      supabase.from('meeting_action_items').select('*').order('due_date'),
    ])
    setMeetings(m || [])
    setActionItems((a || []).reduce((acc, item) => {
      acc[item.meeting_id] = acc[item.meeting_id] || []
      acc[item.meeting_id].push(item)
      return acc
    }, {}))
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

  const filtered = filter === 'All' ? meetings : meetings.filter(m => m.meeting_type === filter)
  const upcoming = filtered.filter(m => m.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date))
  const past = filtered.filter(m => m.date < todayStr)

  const totalPending = Object.values(actionItems).flat().filter(a => a.status !== 'Done').length

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Meetings</h2>
          <p className="page-subtitle">Ministry meeting log · Action items</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={15} /> New Meeting
        </button>
      </div>

      {/* Stats */}
      {meetings.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total meetings', value: meetings.length },
            { label: 'Upcoming', value: meetings.filter(m => m.date >= todayStr).length, color: '#5a9fd4' },
            { label: 'Action items pending', value: totalPending, color: totalPending > 0 ? '#ffa726' : '#22a355' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 100, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color || 'var(--text-primary)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['All', ...MEETING_TYPES].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: filter === t ? (t === 'All' ? 'var(--accent)' : typeColor(t)) : 'var(--bg-card)',
              color: filter === t ? '#fff' : 'var(--text-muted)',
              outline: filter === t ? 'none' : '1px solid var(--border)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {taskMsg && (
        <div style={{ background: '#22a35518', border: '1px solid #22a35530', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#22a355' }}>
          {taskMsg}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
      ) : meetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Calendar size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No meetings recorded yet.</p>
          <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Log your first meeting
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No {filter} meetings found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {upcoming.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Upcoming · {upcoming.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(m => (
                  <MeetingCard key={m.id} meeting={m} actionItems={actionItems[m.id] || []} onEdit={m => setModal(m)} onDelete={deleteMeeting} onTaskCreated={handleTaskCreated} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Past · {past.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {past.map(m => (
                  <MeetingCard key={m.id} meeting={m} actionItems={actionItems[m.id] || []} onEdit={m => setModal(m)} onDelete={deleteMeeting} onTaskCreated={handleTaskCreated} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modal === 'new' ? 'Log Meeting' : 'Edit Meeting'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {modal === 'new' ? 'Record a meeting, decisions, and action items' : 'Update meeting details'}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <MeetingForm
                initial={modal === 'new' ? null : modal}
                onSave={() => { setModal(null); load() }}
                onClose={() => setModal(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
