import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, today } from '../../lib/utils'
import { Bell, Plus, X, Check } from 'lucide-react'
import { scheduleReminder } from '../../hooks/useReminders'

const FONT = 'Nexa, DM Sans, sans-serif'

function Modal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', body: '', due_at: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function defaultDueAt() {
    const d = new Date()
    d.setHours(d.getHours() + 1, 0, 0, 0)
    return d.toISOString().slice(0, 16)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.due_at) return
    setSaving(true)
    await scheduleReminder({
      title: form.title.trim(),
      body: form.body || null,
      due_at: new Date(form.due_at).toISOString(),
    })
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontFamily: FONT }}>Add Reminder</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Title *</label>
            <input className="ksm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="What do you want to be reminded about?" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Date & Time *</label>
            <input className="ksm-input" type="datetime-local" value={form.due_at || defaultDueAt()} onChange={e => set('due_at', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Notes (optional)</label>
            <textarea className="ksm-input" value={form.body} onChange={e => set('body', e.target.value)} placeholder="Additional details…" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Set Reminder'}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReminderRow({ reminder, onRefresh }) {
  const [marking, setMarking] = useState(false)
  const now = new Date()
  const due = new Date(reminder.due_at)
  const isOverdue = due < now && !reminder.done

  async function markDone() {
    setMarking(true)
    await supabase.from('reminders').update({ done: true, status: 'sent' }).eq('id', reminder.id)
    setMarking(false)
    onRefresh()
  }

  const badgeColor = reminder.done ? '#22a355' : isOverdue ? '#ef5350' : '#f97316'
  const badge = reminder.done ? 'Done' : isOverdue ? 'Overdue' : 'Pending'

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 12, opacity: reminder.done ? 0.6 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: FONT, textDecoration: reminder.done ? 'line-through' : 'none' }}>{reminder.title}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor, background: badgeColor + '18', padding: '2px 8px', borderRadius: 6, fontFamily: FONT, flexShrink: 0 }}>{badge}</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>{formatDateTime(reminder.due_at)}</p>
        {reminder.body && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontFamily: FONT }}>{reminder.body}</p>}
      </div>
      {!reminder.done && (
        <button onClick={markDone} disabled={marking}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#22a355', background: '#22a35518', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
          <Check size={13} /> Done
        </button>
      )}
    </div>
  )
}

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('reminders').select('*').order('due_at')
    setReminders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = reminders.filter(r => {
    if (filter === 'Pending') return !r.done
    if (filter === 'Done') return r.done
    return true
  })

  const pendingCount = reminders.filter(r => !r.done).length

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">{pendingCount} pending reminder{pendingCount !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Add Reminder
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['Pending', 'Done', 'All'].map(f => (
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
            <Bell size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>
              {filter === 'Pending' ? 'No pending reminders. You\'re all caught up!' : 'No reminders found.'}
            </p>
          </div>
        ) : (
          filtered.map(r => <ReminderRow key={r.id} reminder={r} onRefresh={load} />)
        )}
      </div>

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load() }} />}
    </div>
  )
}
