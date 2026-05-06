import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PREP_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const VENUES = ['Monthly Saturday Gathering', '4am Teaching Line', 'External Church', 'Cape Coast Gathering', 'Doers of the Word', 'Worship Jesus', 'Prayer Chain', 'Online / Zoom', 'Other']
const EMPTY = { event_name: '', date: '', venue: '', topic: '', scripture: '', preparation_status: 'Not started', notes: '' }

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

function prepStyle(s) {
  if (s === 'Ready') return { color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' }
  if (s === 'In preparation') return { color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' }
  return { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' }
}

function TeachingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.event_name.trim() || !form.date) return
    setSaving(true)
    const payload = { event_name: form.event_name.trim(), date: form.date, venue: form.venue, topic: form.topic, scripture: form.scripture, preparation_status: form.preparation_status, notes: form.notes }
    if (initial?.id) await supabase.from('teaching_calendar').update(payload).eq('id', initial.id)
    else await supabase.from('teaching_calendar').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Event / Occasion *"><input className="ksm-input" value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Monthly Saturday Gathering" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date *"><input type="date" className="ksm-input" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Preparation Status"><select className="ksm-input" value={form.preparation_status} onChange={e => set('preparation_status', e.target.value)}>{PREP_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Venue / Platform"><select className="ksm-input" value={form.venue} onChange={e => set('venue', e.target.value)}><option value="">Select venue</option>{VENUES.map(v => <option key={v}>{v}</option>)}</select></Field>
      <Field label="Topic / Title"><input className="ksm-input" value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="Sermon or teaching topic" /></Field>
      <Field label="Key Scripture"><input className="ksm-input" value={form.scripture} onChange={e => set('scripture', e.target.value)} placeholder="e.g. John 15:5" /></Field>
      <Field label="Notes"><textarea className="ksm-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Preparation notes, outline points…" /></Field>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.event_name.trim() || !form.date} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function EventCard({ event, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const isPast = isOverdue(event.date)
  const ps = prepStyle(event.preparation_status)
  const d = new Date(event.date + 'T00:00:00')

  return (
    <div className="glass-card" style={{ overflow: 'hidden', opacity: isPast ? 0.6 : 1 }}>
      <button className="w-full text-left" style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ textAlign: 'center', width: 40, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>{d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginTop: 2 }}>{d.getDate()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{event.event_name}</span>
            <span className="badge" style={{ color: ps.color, borderColor: ps.border, background: ps.bg }}>{event.preparation_status}</span>
          </div>
          {event.venue && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{event.venue}</p>}
          {event.topic && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }} className="truncate">{event.topic}</p>}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
          {event.scripture && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 12 }}>Scripture: {event.scripture}</p>}
          {event.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{event.notes}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(event)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
            <button onClick={() => onDelete(event.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
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

  async function deleteEvent(id) { if (!confirm('Delete this event?')) return; await supabase.from('teaching_calendar').delete().eq('id', id); load() }

  const todayStr = today()
  const upcoming = events.filter(e => e.date >= todayStr)
  const past = events.filter(e => e.date < todayStr)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div><h2 className="page-title">Teaching Calendar</h2><p className="page-subtitle">Preaching commitments & preparation tracker</p></div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Plus size={15} /> Add</button>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p> : (
        <>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>No upcoming events.</p>
              <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first event</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(e => <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} />)}
            </div>
          )}
          {past.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button onClick={() => setShowPast(!showPast)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
                {showPast ? '▲ Hide past events' : `▼ Show ${past.length} past event${past.length > 1 ? 's' : ''}`}
              </button>
              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...past].reverse().map(e => <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} />)}
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
