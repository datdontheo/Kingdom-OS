import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PREP_STATUSES, prepStatusColor, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, BookOpen, Loader2, Save, Zap, Calendar, MapPin, Edit2, BookMarked } from 'lucide-react'
import TeachingPrepWorkflow from './TeachingPrepWorkflow'

const VENUES = ['Monthly Saturday Gathering', '4am Teaching Line', 'External Church', 'Cape Coast Gathering', 'Doers of the Word', 'Worship Jesus', 'Prayer Chain', 'Online / Zoom', 'Other']

const AI_PREP_BUTTONS = [
  { key: 'outline',              label: 'Teaching Outline',      group: 'Prep', prompt: (t) => `Create a clear teaching outline for the message titled "${t.event_name}"${t.topic ? ` (topic: ${t.topic})` : ''}${t.anchor_scripture ? `. Anchor scripture: ${t.anchor_scripture}` : ''}${t.notes ? `. Notes: ${t.notes}` : ''}. Include main heading, 3-4 sub-points with NKJV scripture references, practical application, and a closing exhortation.` },
  { key: 'outline_20',          label: '20-Min Version',         group: 'Prep', prompt: (t) => `Create a tight 20-minute teaching outline for "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Include: opening hook (2 min), 2-3 main points with scripture (14 min), application (2 min), prayer/declaration (2 min).` },
  { key: 'outline_40',          label: '40-Min Version',         group: 'Prep', prompt: (t) => `Create a full 40-minute teaching outline for "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Include: opening (3 min), context/background (5 min), 3-4 main points with scripture and illustrations (25 min), application (5 min), prayer and declarations (2 min).` },
  { key: 'scriptures',          label: 'Suggest Scriptures',     group: 'Prep', prompt: (t) => `Suggest 5-7 relevant NKJV scriptures for a teaching titled "${t.event_name}"${t.topic ? ` on the topic: ${t.topic}` : ''}. For each scripture provide the reference and a one-sentence explanation of why it fits.` },
  { key: 'discussion_questions',label: 'Discussion Questions',   group: 'Group', prompt: (t) => `Create 5-6 discussion questions for a small group or discipleship session based on the teaching "${t.event_name}"${t.topic ? ` (${t.topic})` : ''}. Questions should range from personal reflection to practical application.` },
  { key: 'prayer_points',       label: 'Prayer Points',          group: 'Group', prompt: (t) => `Create 5-7 targeted prayer points for the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each prayer point should be scripture-anchored (NKJV) and practically worded for congregational prayer.` },
  { key: 'declarations',        label: 'Declarations',           group: 'Group', prompt: (t) => `Write 5-7 powerful faith declarations based on the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each declaration should be scripture-rooted (NKJV), first-person, and spoken with faith and authority.` },
  { key: 'content_ideas',       label: 'Instagram / Reel Ideas', group: 'Media', prompt: (t) => `Create 4-5 short Instagram caption ideas and reel concepts from the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each should be engaging, scripture-anchored, and shareable. Include a hook line, the main message in 2-3 sentences, and a call to action.` },
  { key: 'doctrinal_check',     label: 'Doctrinal Check',        group: 'Review', prompt: (t) => `Review the following teaching notes for doctrinal clarity, scriptural accuracy, and sound Kingdom perspective. Notes: "${t.notes || '(no notes provided)'}". Teaching title: "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Identify any points needing clarification, suggest strengthening scriptures, and affirm what is doctrinally sound.` },
]

const AI_FIELD_MAP = {
  outline: 'outline', outline_20: 'outline', outline_40: 'outline',
  scriptures: 'supporting_scriptures', discussion_questions: 'discussion_questions',
  prayer_points: 'prayer_points', declarations: 'declarations',
  content_ideas: 'content_ideas', doctrinal_check: 'notes',
}

const AI_GROUPS = ['Prep', 'Group', 'Media', 'Review']

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  )
}

function TeachingForm({ initial, onSave, onClose }) {
  const blank = { event_name: '', date: '', venue: '', topic: '', anchor_scripture: '', supporting_scriptures: '', main_summary: '', preparation_status: 'Not started', notes: '', related_series: '', outline: '', discussion_questions: '', prayer_points: '', declarations: '', content_ideas: '' }
  const [form, setForm] = useState(initial || blank)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.event_name.trim() || !form.date) return
    setSaving(true)
    const payload = {
      event_name: form.event_name.trim(), date: form.date, venue: form.venue || null,
      topic: form.topic || null, scripture: form.anchor_scripture || null,
      anchor_scripture: form.anchor_scripture || null,
      supporting_scriptures: form.supporting_scriptures || null,
      main_summary: form.main_summary || null,
      preparation_status: form.preparation_status, notes: form.notes || null,
      related_series: form.related_series || null,
      outline: form.outline || null,
      discussion_questions: form.discussion_questions || null,
      prayer_points: form.prayer_points || null,
      declarations: form.declarations || null,
      content_ideas: form.content_ideas || null,
    }
    if (initial?.id) await supabase.from('teaching_calendar').update(payload).eq('id', initial.id)
    else await supabase.from('teaching_calendar').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Event / Occasion *">
        <input className="ksm-input" value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Monthly Saturday Gathering" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Date *">
          <input type="date" className="ksm-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </Field>
        <Field label="Prep Status">
          <select className="ksm-input" value={form.preparation_status} onChange={e => set('preparation_status', e.target.value)}>
            {PREP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Venue / Platform">
        <select className="ksm-input" value={form.venue} onChange={e => set('venue', e.target.value)}>
          <option value="">Select venue</option>
          {VENUES.map(v => <option key={v}>{v}</option>)}
        </select>
      </Field>
      <Field label="Topic / Message Title">
        <input className="ksm-input" value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="Sermon or teaching topic" />
      </Field>
      <Field label="Anchor Scripture">
        <input className="ksm-input" value={form.anchor_scripture} onChange={e => set('anchor_scripture', e.target.value)} placeholder="e.g. John 15:5 NKJV" />
      </Field>
      <Field label="Supporting Scriptures">
        <input className="ksm-input" value={form.supporting_scriptures} onChange={e => set('supporting_scriptures', e.target.value)} placeholder="e.g. Romans 8:1, Philippians 4:13…" />
      </Field>
      <Field label="Related Series">
        <input className="ksm-input" value={form.related_series} onChange={e => set('related_series', e.target.value)} placeholder="e.g. Living by Faith (Part 2)" />
      </Field>
      <Field label="Notes / Scattered Thoughts">
        <textarea className="ksm-input" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Write down any thoughts, ideas, or notes…" style={{ resize: 'vertical' }} />
      </Field>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.event_name.trim() || !form.date} className="btn-primary" style={{ flex: 1 }}>
          {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Teaching'}
        </button>
      </div>
    </div>
  )
}

function AIPrepPanel({ event, apiKey, onSaved }) {
  const [loadingKey, setLoadingKey] = useState(null)
  const [results, setResults] = useState({})

  async function runAIPrep(btn) {
    if (!apiKey) { alert('Please add your Claude API key in Settings to use AI prep tools.'); return }
    setLoadingKey(btn.key)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          system: 'You are Kingdom OS, a ministry assistant helping Pastor Theophilus Laryea of Kingdom Seekers Ministry prepare powerful, scripturally sound teachings. Always use NKJV when quoting scripture. Be practical, clear, and spiritually grounded.',
          messages: [{ role: 'user', content: btn.prompt(event) }],
        }),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || 'API error') }
      const data = await response.json()
      setResults(prev => ({ ...prev, [btn.key]: data.content?.[0]?.text || 'No response generated.' }))
    } catch (err) {
      setResults(prev => ({ ...prev, [btn.key]: `Error: ${err.message}` }))
    }
    setLoadingKey(null)
  }

  async function saveResult(btn) {
    const text = results[btn.key]
    if (!text || !event.id) return
    const field = AI_FIELD_MAP[btn.key]
    const existing = event[field]
    await supabase.from('teaching_calendar').update({ [field]: existing ? existing + '\n\n---\n\n' + text : text }).eq('id', event.id)
    onSaved()
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>AI Prep Tools</p>

      {AI_GROUPS.map(group => {
        const buttons = AI_PREP_BUTTONS.filter(b => b.group === group)
        return (
          <div key={group} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>{group.toUpperCase()}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {buttons.map(btn => (
                <button key={btn.key} onClick={() => runAIPrep(btn)} disabled={loadingKey === btn.key}
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: loadingKey && loadingKey !== btn.key ? 0.45 : 1, transition: 'opacity 0.15s' }}>
                  {loadingKey === btn.key ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={11} />}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {Object.entries(results).map(([key, text]) => {
        const btn = AI_PREP_BUTTONS.find(b => b.key === key)
        return (
          <div key={key} style={{ marginTop: 14, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{btn?.label}</span>
              <button onClick={() => saveResult(btn)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#22a355', background: '#22a35518', border: '1px solid #22a35530', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                <Save size={11} /> Save to Teaching
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0 }}>{text}</p>
          </div>
        )
      })}
    </div>
  )
}

function EventCard({ event, onEdit, onDelete, apiKey, onRefresh, onPrepWorkflow }) {
  const [expanded, setExpanded] = useState(false)
  const isPast = isOverdue(event.date)
  const statusColor = prepStatusColor(event.preparation_status) || '#6b7280'

  const contentSections = [
    { label: 'Supporting Scriptures', value: event.supporting_scriptures },
    { label: 'Related Series', value: event.related_series },
    { label: 'Notes', value: event.notes },
    { label: 'Teaching Outline', value: event.outline },
    { label: 'Discussion Questions', value: event.discussion_questions },
    { label: 'Prayer Points', value: event.prayer_points },
    { label: 'Declarations', value: event.declarations },
    { label: 'Content Ideas', value: event.content_ideas },
  ].filter(s => s.value)

  return (
    <div className="glass-card" style={{ overflow: 'hidden', padding: 0, borderLeft: `3px solid ${statusColor}` }}>
      {/* Card header */}
      <button
        style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{event.event_name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 6, border: '1px solid ' + statusColor + '30', whiteSpace: 'nowrap' }}>
              {event.preparation_status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isPast ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
              <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
              {formatDate(event.date)}
            </span>
            {event.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                <MapPin size={12} /> {event.venue}
              </span>
            )}
          </div>
          {event.topic && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.topic}
            </p>
          )}
          {event.anchor_scripture && (
            <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 3, fontStyle: 'italic' }}>
              {event.anchor_scripture}
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
          {contentSections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              {contentSections.map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{value}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => onPrepWorkflow(event)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #22a355, #1d8c47)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              <Zap size={12} /> Start Prep
            </button>
            <button onClick={() => onEdit(event)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={() => onDelete(event.id)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ef535030', color: '#ef5350', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>
              Delete
            </button>
          </div>

          <AIPrepPanel event={event} apiKey={apiKey} onSaved={onRefresh} />
        </div>
      )}
    </div>
  )
}

export default function Teaching() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('All')
  const [apiKey, setApiKey] = useState('')
  const [prepWorkflow, setPrepWorkflow] = useState(null)
  const todayStr = today()

  async function load() {
    const { data } = await supabase.from('teaching_calendar').select('*').order('date', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    supabase.from('settings').select('claude_api_key').limit(1).then(({ data }) => {
      if (data?.[0]?.claude_api_key) setApiKey(data[0].claude_api_key)
    })
  }, [])

  async function deleteEvent(id) {
    if (!confirm('Delete this teaching event?')) return
    await supabase.from('teaching_calendar').delete().eq('id', id)
    load()
  }

  const allStatuses = ['All', ...PREP_STATUSES]
  const filtered = filter === 'All' ? events : events.filter(e => e.preparation_status === filter)
  const upcoming = filtered.filter(e => e.date >= todayStr)
  const past = filtered.filter(e => e.date < todayStr).reverse()

  const notReady = events.filter(e => e.date >= todayStr && e.preparation_status !== 'Ready' && e.preparation_status !== 'Taught').length

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Teachings</h2>
          <p className="page-subtitle">Preaching calendar · Preparation tracker · AI tools</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={15} /> New Teaching
        </button>
      </div>

      {/* Stats */}
      {events.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total teachings', value: events.length },
            { label: 'Upcoming', value: events.filter(e => e.date >= todayStr).length, color: '#5a9fd4' },
            { label: 'Need prep', value: notReady, color: notReady > 0 ? '#f97316' : '#22a355' },
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
        {allStatuses.map(s => {
          const color = s === 'All' ? 'var(--accent)' : (prepStatusColor(s) || '#6b7280')
          const active = filter === s
          return (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: active ? color : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text-muted)',
                outline: active ? 'none' : '1px solid var(--border)',
              }}>
              {s}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookMarked size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No teachings recorded yet.</p>
          <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Add your first teaching
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No teachings with status "{filter}".</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {upcoming.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Upcoming · {upcoming.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} apiKey={apiKey} onRefresh={load} onPrepWorkflow={e => setPrepWorkflow(e)} />
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
                {past.map(e => (
                  <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} apiKey={apiKey} onRefresh={load} onPrepWorkflow={e => setPrepWorkflow(e)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teaching modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modal === 'new' ? 'Add Teaching' : 'Edit Teaching'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {modal === 'new' ? 'Schedule a teaching and track its preparation' : 'Update teaching details and prep content'}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <TeachingForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
            </div>
          </div>
        </div>
      )}

      {prepWorkflow && (
        <TeachingPrepWorkflow
          teaching={prepWorkflow}
          onClose={() => setPrepWorkflow(null)}
          onSave={() => { setPrepWorkflow(null); load() }}
        />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
