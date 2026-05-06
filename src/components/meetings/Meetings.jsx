import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, MEETING_TYPES, TASK_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const EMPTY_MEETING = {
  meeting_type: 'Leadership Huddle', date: '', attendees: '',
  key_decisions: '', notes: ''
}

const inputCls = 'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-600/60'

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

function ActionItemEditor({ items, onChange }) {
  function addItem() {
    onChange([...items, { title: '', owner: '', due_date: '', status: 'Not started' }])
  }
  function updateItem(i, key, val) {
    const next = items.map((item, idx) => idx === i ? { ...item, [key]: val } : item)
    onChange(next)
  }
  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-2">Action Items</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-700/60 border border-gray-600/60 rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none"
                placeholder="Action item title"
                value={item.title}
                onChange={e => updateItem(i, 'title', e.target.value)}
              />
              <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-700/60 border border-gray-600/60 rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none"
                placeholder="Owner"
                value={item.owner}
                onChange={e => updateItem(i, 'owner', e.target.value)}
              />
              <input
                type="date"
                className="bg-gray-700/60 border border-gray-600/60 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none"
                value={item.due_date}
                onChange={e => updateItem(i, 'due_date', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="mt-2 text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
        <Plus size={12} /> Add action item
      </button>
    </div>
  )
}

function MeetingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_MEETING)
  const [actionItems, setActionItems] = useState([])
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (initial?.id) {
      supabase.from('meeting_action_items').select('*').eq('meeting_id', initial.id)
        .then(({ data }) => setActionItems(data || []))
    }
  }, [initial])

  async function save() {
    if (!form.date) return
    setSaving(true)
    const payload = {
      meeting_type: form.meeting_type,
      date: form.date,
      attendees: form.attendees,
      key_decisions: form.key_decisions,
      notes: form.notes,
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
      await supabase.from('meeting_action_items').insert(
        validItems.map(a => ({
          meeting_id: meetingId,
          title: a.title.trim(),
          owner: a.owner || null,
          due_date: a.due_date || null,
          status: a.status || 'Not started',
        }))
      )
      // Mirror action items to tasks table
      await supabase.from('tasks').insert(
        validItems.map(a => ({
          title: a.title.trim(),
          category: 'Admin',
          priority: 'Medium',
          status: 'Not started',
          due_date: a.due_date || null,
          assigned_to: a.owner || null,
          notes: `From meeting: ${form.meeting_type} on ${form.date}`,
        }))
      )
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Meeting Type</label>
          <select className={inputCls + ' cursor-pointer'} value={form.meeting_type} onChange={e => set('meeting_type', e.target.value)}>
            {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <Field label="Date *">
          <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
      </div>
      <Field label="Attendees">
        <input className={inputCls} value={form.attendees} onChange={e => set('attendees', e.target.value)} placeholder="Names, comma-separated" />
      </Field>
      <Field label="Key Decisions">
        <textarea className={inputCls} rows={3} value={form.key_decisions} onChange={e => set('key_decisions', e.target.value)} placeholder="What was decided in this meeting?" />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Discussion points, context…" />
      </Field>
      <ActionItemEditor items={actionItems} onChange={setActionItems} />
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
        <button onClick={save} disabled={saving || !form.date} className="flex-1 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function MeetingCard({ meeting, actionItems, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl overflow-hidden">
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">{meeting.meeting_type}</span>
            <span className="text-xs text-violet-400">{formatDate(meeting.date)}</span>
          </div>
          {meeting.attendees && <p className="text-xs text-gray-500 mt-0.5 truncate">{meeting.attendees}</p>}
          {actionItems.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">{actionItems.length} action item{actionItems.length > 1 ? 's' : ''}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-500 mt-0.5 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 mt-0.5 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/40">
          {meeting.key_decisions && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Key Decisions</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{meeting.key_decisions}</p>
            </div>
          )}
          {meeting.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}
          {actionItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-2">Action Items</p>
              <div className="space-y-1.5">
                {actionItems.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.status === 'Done' ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <span className={`flex-1 ${a.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>{a.title}</span>
                    {a.owner && <span className="text-xs text-gray-500 shrink-0">{a.owner}</span>}
                    {a.due_date && <span className="text-xs text-gray-500 shrink-0">{formatDate(a.due_date)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(meeting)} className="text-xs text-violet-400 px-3 py-1.5 rounded-lg border border-violet-800/40">Edit</button>
            <button onClick={() => onDelete(meeting.id)} className="text-xs text-red-400 px-3 py-1.5 rounded-lg border border-red-900/40">Delete</button>
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
    const grouped = (a || []).reduce((acc, item) => {
      acc[item.meeting_id] = acc[item.meeting_id] || []
      acc[item.meeting_id].push(item)
      return acc
    }, {})
    setActionItems(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteMeeting(id) {
    if (!confirm('Delete this meeting and its action items?')) return
    await supabase.from('meeting_notes').delete().eq('id', id)
    load()
  }

  const filtered = filterType === 'All' ? meetings : meetings.filter(m => m.meeting_type === filterType)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Meeting Notes</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ministry meeting log & action items</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-sm px-3 py-2 rounded-lg font-medium">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="mb-4">
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All Meeting Types</option>
          {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No meetings recorded.</p>
          <button onClick={() => setModal('new')} className="text-violet-400 text-sm mt-2 hover:underline">Record your first meeting</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <MeetingCard key={m.id} meeting={m} actionItems={actionItems[m.id] || []} onEdit={m => setModal(m)} onDelete={deleteMeeting} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Record Meeting' : 'Edit Meeting'} onClose={() => setModal(null)}>
          <MeetingForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
