import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDateTime } from '../../lib/utils'
import { Lightbulb, CheckSquare, Bell, FileText, MessageCircle, Target, BookOpen, X, Check } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

const TYPE_META = {
  'Task': { icon: CheckSquare, color: '#5a9fd4' },
  'Reminder': { icon: Bell, color: '#ffa726' },
  'Meeting': { icon: FileText, color: '#8b5cf6' },
  'WhatsApp Message': { icon: MessageCircle, color: '#22a355' },
  'Goal': { icon: Target, color: '#22a355' },
  'Teaching Preparation': { icon: BookOpen, color: '#5a9fd4' },
}

function SuggestionCard({ suggestion, onRefresh }) {
  const [acting, setActing] = useState(false)
  const meta = TYPE_META[suggestion.suggestion_type] || { icon: Lightbulb, color: 'var(--accent)' }
  const Icon = meta.icon

  async function accept() {
    setActing(true)
    try {
      const action = suggestion.action_json
      if (action) {
        if (action.type === 'create_task') {
          await supabase.from('tasks').insert({
            title: action.title,
            category: action.category || 'Admin',
            priority: action.priority || 'Medium',
            status: 'Not started',
            due_date: action.due_date || null,
            notes: action.notes || null,
          })
        } else if (action.type === 'set_reminder') {
          await supabase.from('reminders').insert({
            title: action.title,
            body: action.notes || null,
            due_at: action.due_at || new Date(Date.now() + 3600000).toISOString(),
            status: 'pending',
            done: false,
          })
        } else if (action.type === 'add_goal') {
          await supabase.from('goals').insert({
            title: action.title,
            category: action.category || 'Vision',
            notes: action.notes || null,
            next_action: action.next_action || null,
            status: 'Active',
          })
        }
      }
      await supabase.from('assistant_suggestions').update({ status: 'accepted', acted_on_at: new Date().toISOString() }).eq('id', suggestion.id)
    } catch (e) {
      console.error('Accept error', e)
    }
    setActing(false)
    onRefresh()
  }

  async function dismiss() {
    await supabase.from('assistant_suggestions').update({ status: 'dismissed' }).eq('id', suggestion.id)
    onRefresh()
  }

  const isPending = suggestion.status === 'pending'

  return (
    <div className="glass-card" style={{ padding: 16, opacity: isPending ? 1 : 0.65 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} style={{ color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{suggestion.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: meta.color + '18', padding: '2px 8px', borderRadius: 6, fontFamily: FONT }}>{suggestion.suggestion_type}</span>
            {!isPending && (
              <span style={{ fontSize: 11, fontWeight: 600, color: suggestion.status === 'accepted' ? '#22a355' : '#9b9189', background: suggestion.status === 'accepted' ? '#22a35518' : '#9b918918', padding: '2px 8px', borderRadius: 6, fontFamily: FONT }}>
                {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
              </span>
            )}
          </div>
          {suggestion.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: FONT }}>{suggestion.description}</p>}
          {suggestion.related_person_name && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>Person: {suggestion.related_person_name}</p>
          )}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: FONT }}>{formatDateTime(suggestion.created_at)}</p>

          {isPending && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={accept} disabled={acting}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#22a355', background: '#22a35518', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}>
                <Check size={13} /> {acting ? 'Accepting…' : 'Accept'}
              </button>
              <button onClick={dismiss}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#ef5350', background: '#ef535018', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}>
                <X size={13} /> Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('assistant_suggestions').select('*').order('created_at', { ascending: false })
    setSuggestions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = suggestions.filter(s => {
    if (filter === 'Pending') return s.status === 'pending'
    if (filter === 'Accepted') return s.status === 'accepted'
    if (filter === 'Dismissed') return s.status === 'dismissed'
    if (filter === 'Completed') return s.status === 'completed'
    return true
  })

  const pendingCount = suggestions.filter(s => s.status === 'pending').length

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suggestions</h1>
          <p className="page-subtitle">{pendingCount} pending suggestion{pendingCount !== 1 ? 's' : ''} from the assistant</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Pending', 'Accepted', 'Dismissed', 'All'].map(f => (
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
        <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>Loading suggestions…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <Lightbulb size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>
            {filter === 'Pending' ? 'No pending suggestions. Chat with the assistant to get started.' : `No ${filter.toLowerCase()} suggestions.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(s => <SuggestionCard key={s.id} suggestion={s} onRefresh={load} />)}
        </div>
      )}
    </div>
  )
}
