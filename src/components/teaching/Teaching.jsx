import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PREP_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const VENUES = [
  'Monthly Saturday Gathering', '4am Teaching Line', 'External Church',
  'Cape Coast Gathering', 'Doers of the Word', 'Worship Jesus',
  'Prayer Chain', 'Online / Zoom', 'Other'
]

const EMPTY = {
  event_name: '', date: '', venue: '', topic: '', scripture: '',
  preparation_status: 'Not started', notes: ''
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

function prepColor(s) {
  return s === 'Ready' ? 'text-green-300 bg-green-950/40 border-green-800/40'
    : s === 'In preparation' ? 'text-amber-300 bg-amber-950/40 border-amber-800/40'
    : 'text-gray-400 bg-gray-800/40 border-gray-700/40'
}

function TeachingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.event_name.trim() || !form.date) return
    setSaving(true)
    const payload = {
      event_name: form.event_name.trim(),
      date: form.date,
      venue: form.venue,
      topic: form.topic,
      scripture: form.scripture,
      preparation_status: form.preparation_status,
      notes: form.notes,
    }
    if (initial?.id) {
      await supabase.from('teaching_calendar').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('teaching_calendar').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-4">
      <Field label="Event / Occasion *">
        <input className={inputCls} value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Monthly Saturday Gathering" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date *">
          <input type="date" className={inputCls} value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Preparation Status">
          <select className={inputCls + ' cursor-pointer'} value={form.preparation_status} onChange={e => set('preparation_status', e.target.value)}>
            {PREP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Venue / Platform">
        <select className={inputCls + ' cursor-pointer'} value={form.venue} onChange={e => set('venue', e.target.value)}>
          <option value="">Select venue</option>
          {VENUES.map(v => <option key={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Topic / Title">
        <input className={inputCls} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="Sermon or teaching topic" />
      </Field>
      <Field label="Key Scripture">
        <input className={inputCls} value={form.scripture} onChange={e => set('scripture', e.target.value)} placeholder="e.g. John 15:5" />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Preparation notes, outline points…" />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
        <button onClick={save} disabled={saving || !form.event_name.trim() || !form.date} className="flex-1 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function EventCard({ event, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const isPast = isOverdue(event.date)

  return (
    <div className={`bg-gray-900/60 border rounded-xl overflow-hidden ${isPast ? 'opacity-60 border-gray-800/40' : 'border-gray-800/60'}`}>
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <div className="shrink-0 text-center w-10">
          <p className="text-xs text-violet-400 font-medium leading-none">
            {new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}
          </p>
          <p className="text-lg font-bold text-white leading-none mt-0.5">
            {new Date(event.date + 'T00:00:00').getDate()}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">{event.event_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${prepColor(event.preparation_status)}`}>
              {event.preparation_status}
            </span>
          </div>
          {event.venue && <p className="text-xs text-gray-500 mt-0.5">{event.venue}</p>}
          {event.topic && <p className="text-xs text-gray-400 mt-0.5 truncate">{event.topic}</p>}
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-500 mt-0.5 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 mt-0.5 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/40">
          {event.scripture && (
            <p className="text-xs text-violet-400 mt-3">Scripture: {event.scripture}</p>
          )}
          {event.notes && (
            <p className="text-sm text-gray-400 mt-3 whitespace-pre-wrap">{event.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(event)} className="text-xs text-violet-400 px-3 py-1.5 rounded-lg border border-violet-800/40">Edit</button>
            <button onClick={() => onDelete(event.id)} className="text-xs text-red-400 px-3 py-1.5 rounded-lg border border-red-900/40">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Teaching() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [showPast, setShowPast] = useState(false)

  async function load() {
    const { data } = await supabase.from('teaching_calendar').select('*').order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return
    await supabase.from('teaching_calendar').delete().eq('id', id)
    load()
  }

  const todayStr = today()
  const upcoming = events.filter(e => e.date >= todayStr)
  const past = events.filter(e => e.date < todayStr)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Teaching Calendar</h2>
          <p className="text-xs text-gray-500 mt-0.5">Preaching commitments & preparation tracker</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-sm px-3 py-2 rounded-lg font-medium">
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-10">Loading…</p>
      ) : (
        <>
          {upcoming.length === 0 && !showPast ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No upcoming events.</p>
              <button onClick={() => setModal('new')} className="text-violet-400 text-sm mt-2 hover:underline">Add your first event</button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(e => (
                <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-6">
              <button onClick={() => setShowPast(!showPast)} className="text-xs text-gray-500 hover:text-gray-300 mb-3">
                {showPast ? '▲ Hide past events' : `▼ Show ${past.length} past event${past.length > 1 ? 's' : ''}`}
              </button>
              {showPast && (
                <div className="space-y-2">
                  {past.reverse().map(e => (
                    <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Event' : 'Edit Event'} onClose={() => setModal(null)}>
          <TeachingForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
