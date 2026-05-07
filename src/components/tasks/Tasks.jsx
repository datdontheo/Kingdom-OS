import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, CATEGORIES, PRIORITIES, TASK_STATUSES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY = { title: '', category: 'Admin', priority: 'Medium', status: 'Not started', due_date: '', assigned_to: '', notes: '' }

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

function TaskForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { title: form.title.trim(), category: form.category, priority: form.priority, status: form.status, due_date: form.due_date || null, assigned_to: form.assigned_to || null, notes: form.notes }
    if (initial?.id) await supabase.from('tasks').update(payload).eq('id', initial.id)
    else await supabase.from('tasks').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Title *"><input className="ksm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Category"><select className="ksm-input" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Priority"><select className="ksm-input" value={form.priority} onChange={e => set('priority', e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Status"><select className="ksm-input" value={form.status} onChange={e => set('status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Due Date"><input type="date" className="ksm-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></Field>
      </div>
      <Field label="Assigned To"><input className="ksm-input" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Officer name" /></Field>
      <Field label="Notes"><textarea className="ksm-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Context…" /></Field>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.title.trim()} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}

function priorityDot(p) {
  return p === 'High' ? 'var(--accent-red)' : p === 'Medium' ? 'var(--accent-amber)' : 'var(--text-muted)'
}
function statusStyle(s) {
  if (s === 'Done') return { color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' }
  if (s === 'In progress') return { color: 'var(--accent-blue)', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' }
  return { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' }
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'Done'
  const ss = statusStyle(task.status)

  return (
    <div className="glass-card" style={{ overflow: 'hidden', borderColor: overdue ? 'rgba(248,113,113,0.3)' : undefined }}>
      <button className="w-full text-left" style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: priorityDot(task.priority) }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 13, fontWeight: 500, color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.title}</span>
            <span className="badge" style={{ color: ss.color, borderColor: ss.border, background: ss.bg }}>{task.status}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.category}</span>
            {task.due_date && <span style={{ fontSize: 11, color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>Due {formatDate(task.due_date)}</span>}
            {task.assigned_to && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→ {task.assigned_to}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
          {task.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, whiteSpace: 'pre-wrap' }}>{task.notes}</p>}
          <div className="flex gap-2 mt-3 flex-wrap">
            {TASK_STATUSES.filter(s => s !== task.status).map(s => (
              <button key={s} onClick={() => onStatusChange(task.id, s)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>→ {s}</button>
            ))}
            <button onClick={() => onEdit(task)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Edit</button>
            <button onClick={() => onDelete(task.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filterCat, setFilterCat] = useState('All')
  const [filterPri, setFilterPri] = useState('All')
  const [filterStatus, setFilterStatus] = useState('Active')

  async function load() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteTask(id) { if (!confirm('Delete this task?')) return; await supabase.from('tasks').delete().eq('id', id); load() }
  async function updateStatus(id, status) { await supabase.from('tasks').update({ status }).eq('id', id); load() }

  const filtered = tasks.filter(t => {
    const matchCat = filterCat === 'All' || t.category === filterCat
    const matchPri = filterPri === 'All' || t.priority === filterPri
    const matchStatus = filterStatus === 'All' ? true : filterStatus === 'Active' ? t.status !== 'Done' : t.status === filterStatus
    return matchCat && matchPri && matchStatus
  })
  const grouped = TASK_STATUSES.reduce((acc, s) => { acc[s] = filtered.filter(t => t.status === s); return acc }, {})

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div><h2 className="page-title">Tasks</h2><p className="page-subtitle">Ministry pipeline & to-dos</p></div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Plus size={15} /> Add</button>
      </div>

      {/* Status filter — pill buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {['Active', 'All', ...TASK_STATUSES].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
              background: filterStatus === f ? 'var(--accent)' : 'transparent',
              color: filterStatus === f ? '#fff' : 'var(--text-muted)',
              borderColor: filterStatus === f ? 'var(--accent)' : 'var(--border)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Category + Priority dropdowns */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="ksm-input" style={{ minWidth: 130, flex: '1 1 130px', maxWidth: 200 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {['All', ...CATEGORIES].map(o => <option key={o}>{o}</option>)}
        </select>
        <select className="ksm-input" style={{ minWidth: 120, flex: '1 1 120px', maxWidth: 160 }} value={filterPri} onChange={e => setFilterPri(e.target.value)}>
          {['All', ...PRIORITIES].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No tasks found.</p>
            <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first task</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {TASK_STATUSES.map(s => grouped[s]?.length > 0 && (
              <div key={s}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s} · {grouped[s].length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped[s].map(t => <TaskCard key={t.id} task={t} onEdit={t => setModal(t)} onDelete={deleteTask} onStatusChange={updateStatus} />)}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'new' ? 'Add Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <TaskForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
