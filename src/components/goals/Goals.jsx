import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, goalStatusColor, GOAL_CATEGORIES, GOAL_STATUSES } from '../../lib/utils'
import { Target, Plus, X } from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

function Modal({ goal, onClose, onSave }) {
  const blank = { title: '', category: 'Vision', target_date: '', notes: '', next_action: '', status: 'Active' }
  const [form, setForm] = useState(goal || blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      category: form.category,
      target_date: form.target_date || null,
      notes: form.notes || null,
      next_action: form.next_action || null,
      status: form.status,
    }
    if (goal?.id) {
      await supabase.from('goals').update(payload).eq('id', goal.id)
    } else {
      await supabase.from('goals').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontFamily: FONT }}>{goal?.id ? 'Edit Goal' : 'Add Goal'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Goal Title *</label>
            <input className="ksm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Strengthen discipleship" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Category</label>
              <select className="ksm-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Status</label>
              <select className="ksm-input" value={form.status} onChange={e => set('status', e.target.value)}>
                {GOAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Target Date</label>
            <input className="ksm-input" type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Next Action</label>
            <input className="ksm-input" value={form.next_action} onChange={e => set('next_action', e.target.value)} placeholder="What is the next step for this goal?" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', fontFamily: FONT, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea className="ksm-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any context or details for this goal…" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : (goal?.id ? 'Update Goal' : 'Add Goal')}
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoalCard({ goal, onEdit, onRefresh }) {
  const [updating, setUpdating] = useState(false)
  const statusColor = goalStatusColor(goal.status)

  async function markComplete() {
    setUpdating(true)
    await supabase.from('goals').update({ status: 'Completed' }).eq('id', goal.id)
    setUpdating(false)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${goal.title}"?`)) return
    await supabase.from('goals').delete().eq('id', goal.id)
    onRefresh()
  }

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{goal.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusColor + '18', padding: '2px 8px', borderRadius: 6, fontFamily: FONT }}>{goal.status}</span>
          </div>
          {goal.next_action && (
            <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontFamily: FONT }}>Next: {goal.next_action}</p>
          )}
          {goal.target_date && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>Target: {formatDate(goal.target_date)}</p>
          )}
          {goal.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: FONT }}>{goal.notes}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit}
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-dim)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT }}>
            Edit
          </button>
        </div>
      </div>
      {goal.status !== 'Completed' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={markComplete} disabled={updating}
            style={{ fontSize: 11, fontWeight: 600, color: '#22a355', background: '#22a35518', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: FONT }}>
            Mark Complete
          </button>
          <button onClick={handleDelete}
            style={{ fontSize: 11, fontWeight: 600, color: '#ef5350', background: '#ef535018', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: FONT }}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Active')
  const [modal, setModal] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('goals').select('*').order('created_at')
    setGoals(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'All' ? goals : goals.filter(g => g.status === filter)

  const grouped = GOAL_CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(g => g.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const uncategorized = filtered.filter(g => !GOAL_CATEGORIES.includes(g.category))
  if (uncategorized.length > 0) grouped['Other'] = (grouped['Other'] || []).concat(uncategorized)

  const activeCount = goals.filter(g => g.status === 'Active').length

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">{activeCount} active goal{activeCount !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Add Goal
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Active', 'On hold', 'Completed', 'All'].map(f => (
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
        <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>Loading goals…</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <Target size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-muted)', fontFamily: FONT, fontSize: 14 }}>
            {filter === 'Active' ? 'No active goals yet. Add one to stay focused on your ministry vision.' : `No goals with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>{cat}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(g => (
                  <GoalCard key={g.id} goal={g} onEdit={() => setModal(g)} onRefresh={load} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal goal={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
