import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PREP_STATUSES, prepStatusColor, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, BookOpen, Loader2, Save, Zap } from 'lucide-react'
import TeachingPrepWorkflow from './TeachingPrepWorkflow'

const FONT = 'Nexa, DM Sans, sans-serif'
const VENUES = ['Monthly Saturday Gathering', '4am Teaching Line', 'External Church', 'Cape Coast Gathering', 'Doers of the Word', 'Worship Jesus', 'Prayer Chain', 'Online / Zoom', 'Other']

const AI_PREP_BUTTONS = [
  { key: 'outline', label: 'Create Teaching Outline', prompt: (t) => `Create a clear teaching outline for the message titled "${t.event_name}"${t.topic ? ` (topic: ${t.topic})` : ''}${t.anchor_scripture ? `. Anchor scripture: ${t.anchor_scripture}` : ''}${t.notes ? `. Notes: ${t.notes}` : ''}. Include main heading, 3-4 sub-points with NKJV scripture references, practical application, and a closing exhortation.` },
  { key: 'scriptures', label: 'Suggest Scriptures', prompt: (t) => `Suggest 5-7 relevant NKJV scriptures for a teaching titled "${t.event_name}"${t.topic ? ` on the topic: ${t.topic}` : ''}. For each scripture provide the reference and a one-sentence explanation of why it fits.` },
  { key: 'outline_20', label: '20-Minute Version', prompt: (t) => `Create a tight 20-minute teaching outline for "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Include: opening hook (2 min), 2-3 main points with scripture (14 min), application (2 min), prayer/declaration (2 min).` },
  { key: 'outline_40', label: '40-Minute Version', prompt: (t) => `Create a full 40-minute teaching outline for "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Include: opening (3 min), context/background (5 min), 3-4 main points with scripture and illustrations (25 min), application (5 min), prayer and declarations (2 min).` },
  { key: 'discussion_questions', label: 'Discussion Questions', prompt: (t) => `Create 5-6 discussion questions for a small group or discipleship session based on the teaching "${t.event_name}"${t.topic ? ` (${t.topic})` : ''}. Questions should range from personal reflection to practical application.` },
  { key: 'prayer_points', label: 'Prayer Points', prompt: (t) => `Create 5-7 targeted prayer points for the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each prayer point should be scripture-anchored (NKJV) and practically worded for congregational prayer.` },
  { key: 'declarations', label: 'Declarations', prompt: (t) => `Write 5-7 powerful faith declarations based on the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each declaration should be scripture-rooted (NKJV), first-person, and spoken with faith and authority.` },
  { key: 'content_ideas', label: 'Instagram / Reel Ideas', prompt: (t) => `Create 4-5 short Instagram caption ideas and reel concepts from the teaching "${t.event_name}"${t.topic ? ` on ${t.topic}` : ''}. Each should be engaging, scripture-anchored, and shareable. Include a hook line, the main message in 2-3 sentences, and a call to action.` },
  { key: 'doctrinal_check', label: 'Check Doctrinal Clarity', prompt: (t) => `Review the following teaching notes for doctrinal clarity, scriptural accuracy, and sound Kingdom perspective. Notes: "${t.notes || '(no notes provided)'}". Teaching title: "${t.event_name}"${t.anchor_scripture ? `. Anchor: ${t.anchor_scripture}` : ''}. Identify any points needing clarification, suggest strengthening scriptures, and affirm what is doctrinally sound.` },
]

const AI_FIELD_MAP = {
  outline: 'outline', outline_20: 'outline', outline_40: 'outline',
  scriptures: 'supporting_scriptures', discussion_questions: 'discussion_questions',
  prayer_points: 'prayer_points', declarations: 'declarations',
  content_ideas: 'content_ideas', doctrinal_check: 'notes',
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
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Event / Occasion *</label>
        <input className="ksm-input" value={form.event_name} onChange={e => set('event_name', e.target.value)} placeholder="e.g. Monthly Saturday Gathering" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Date *</label>
          <input type="date" className="ksm-input" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Preparation Status</label>
          <select className="ksm-input" value={form.preparation_status} onChange={e => set('preparation_status', e.target.value)}>
            {PREP_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Venue / Platform</label>
        <select className="ksm-input" value={form.venue} onChange={e => set('venue', e.target.value)}>
          <option value="">Select venue</option>
          {VENUES.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Topic / Message Title</label>
        <input className="ksm-input" value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="Sermon or teaching topic" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Anchor Scripture</label>
        <input className="ksm-input" value={form.anchor_scripture} onChange={e => set('anchor_scripture', e.target.value)} placeholder="e.g. John 15:5 NKJV" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Supporting Scriptures</label>
        <input className="ksm-input" value={form.supporting_scriptures} onChange={e => set('supporting_scriptures', e.target.value)} placeholder="e.g. Romans 8:1, Philippians 4:13…" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Related Series</label>
        <input className="ksm-input" value={form.related_series} onChange={e => set('related_series', e.target.value)} placeholder="e.g. Living by Faith (Part 2)" />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Notes / Scattered Thoughts</label>
        <textarea className="ksm-input" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Write down any thoughts, ideas, or notes for this teaching…" style={{ resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.event_name.trim() || !form.date} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function AIPrepPanel({ event, apiKey, onSaved }) {
  const [loadingKey, setLoadingKey] = useState(null)
  const [results, setResults] = useState({})

  async function runAIPrep(btn) {
    if (!apiKey) { alert('Please add your Groq API key in Settings to use AI prep tools.'); return }
    setLoadingKey(btn.key)
    try {
      const prompt = btn.prompt(event)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2000,
          messages: [
            { role: 'system', content: 'You are Kingdom OS, a ministry assistant helping Pastor Theophilus Laryea of Kingdom Seekers Ministry prepare powerful, scripturally sound teachings. Always use NKJV when quoting scripture. Be practical, clear, and spiritually grounded.' },
            { role: 'user', content: prompt },
          ],
        }),
      })
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || 'No response generated.'
      setResults(prev => ({ ...prev, [btn.key]: text }))
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
    const updated = existing ? existing + '\n\n---\n\n' + text : text
    await supabase.from('teaching_calendar').update({ [field]: updated }).eq('id', event.id)
    onSaved()
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT, marginBottom: 12 }}>AI Prep Tools</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {AI_PREP_BUTTONS.map(btn => (
          <button key={btn.key} onClick={() => runAIPrep(btn)} disabled={loadingKey === btn.key}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, opacity: loadingKey && loadingKey !== btn.key ? 0.5 : 1 }}>
            {loadingKey === btn.key ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={12} />}
            {btn.label}
          </button>
        ))}
      </div>

      {Object.entries(results).map(([key, text]) => {
        const btn = AI_PREP_BUTTONS.find(b => b.key === key)
        return (
          <div key={key} style={{ marginTop: 16, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: FONT }}>{btn?.label}</span>
              <button onClick={() => saveResult(btn)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#22a355', background: '#22a35518', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
                <Save size={11} /> Save to Teaching
              </button>
            </div>
            <pre style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: FONT, margin: 0 }}>{text}</pre>
          </div>
        )
      })}
    </div>
  )
}

function EventCard({ event, onEdit, onDelete, apiKey, onRefresh, onPrepWorkflow }) {
  const [expanded, setExpanded] = useState(false)
  const isPast = isOverdue(event.date)
  const statusColor = prepStatusColor(event.preparation_status)
  const d = new Date(event.date + 'T00:00:00')

  return (
    <div className="glass-card" style={{ overflow: 'hidden', opacity: isPast ? 0.65 : 1 }}>
      <button style={{ width: '100%', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ textAlign: 'center', width: 40, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', fontFamily: FONT }}>{d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginTop: 2, fontFamily: FONT }}>{d.getDate()}</p>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{event.event_name}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 6, border: '1px solid ' + statusColor + '30', fontFamily: FONT }}>{event.preparation_status}</span>
          </div>
          {event.venue && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>{event.venue}</p>}
          {event.topic && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.topic}</p>}
          {event.anchor_scripture && <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2, fontFamily: FONT }}>{event.anchor_scripture}</p>}
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {event.supporting_scriptures && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Supporting Scriptures</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT }}>{event.supporting_scriptures}</p>
              </div>
            )}
            {event.related_series && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Series</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT }}>{event.related_series}</p>
              </div>
            )}
            {event.notes && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{event.notes}</p>
              </div>
            )}
            {event.outline && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Teaching Outline</p>
                <pre style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{event.outline}</pre>
              </div>
            )}
            {event.discussion_questions && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Discussion Questions</p>
                <pre style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{event.discussion_questions}</pre>
              </div>
            )}
            {event.prayer_points && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Prayer Points</p>
                <pre style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{event.prayer_points}</pre>
              </div>
            )}
            {event.declarations && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Declarations</p>
                <pre style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{event.declarations}</pre>
              </div>
            )}
            {event.content_ideas && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: FONT, marginBottom: 2 }}>Content Ideas</p>
                <pre style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: FONT, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{event.content_ideas}</pre>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button onClick={() => onPrepWorkflow(event)}
              style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, #22a355, #1d8c47)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} /> Start Prep
            </button>
            <button onClick={() => onEdit(event)}
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
            <button onClick={() => onDelete(event.id)}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #ef535030', color: '#ef5350', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontWeight: 600 }}>Delete</button>
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
  const [showPast, setShowPast] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [prepWorkflow, setPrepWorkflow] = useState(null)

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

  const todayStr = today()
  const upcoming = events.filter(e => e.date >= todayStr)
  const past = events.filter(e => e.date < todayStr)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Teachings</h2>
          <p className="page-subtitle">Preaching calendar · Preparation tracker · AI prep tools</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0', fontFamily: FONT }}>Loading…</p> : (
        <>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <BookOpen size={32} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontFamily: FONT }}>No upcoming teachings.</p>
              <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Add your first teaching</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(e => <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} apiKey={apiKey} onRefresh={load} onPrepWorkflow={e => setPrepWorkflow(e)} />)}
            </div>
          )}

          {past.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button onClick={() => setShowPast(!showPast)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: FONT }}>
                {showPast ? '▲ Hide past teachings' : `▼ Show ${past.length} past teaching${past.length > 1 ? 's' : ''}`}
              </button>
              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...past].reverse().map(e => <EventCard key={e.id} event={e} onEdit={e => setModal(e)} onDelete={deleteEvent} apiKey={apiKey} onRefresh={load} onPrepWorkflow={e => setPrepWorkflow(e)} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{modal === 'new' ? 'Add Teaching' : 'Edit Teaching'}</h3>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
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
    </div>
  )
}
