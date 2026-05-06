import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, CATEGORIES, PRIORITIES, TASK_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

const EMPTY = {
  title: '', category: 'Admin', priority: 'Medium', status: 'Not started',
  due_date: '', assigned_to: '', notes: ''
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

function TaskForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      category: form.category,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      notes: form.notes,
    }
    if (initial?.id) {
      await supabase.from('tasks').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-4">
      <Field label="Title *">
        <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className={inputCls + ' cursor-pointer'} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls + ' cursor-pointer'} value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select className={inputCls + ' cursor-pointer'} value={form.status} onChange={e => set('status', e.target.value)}>
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" className={inputCls} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </Field>
      </div>
      <Field label="Assigned To">
        <input className={inputCls} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Officer or team member" />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional context…" />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
        <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function priorityColor(p) {
  return p === 'High' ? 'bg-red-400' : p === 'Medium' ? 'bg-amber-400' : 'bg-gray-500'
}
function statusColor(s) {
  return s === 'Done' ? 'text-green-400 bg-green-950/40 border-green-800/40'
    : s === 'In progress' ? 'text-blue-300 bg-blue-950/40 border-blue-800/40'
    : 'text-gray-400 bg-gray-800/40 border-gray-700/40'
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'Done'

  return (
    <div className={`bg-gray-900/60 border rounded-xl overflow-hidden ${overdue ? 'border-red-900/50' : 'border-gray-800/60'}`}>
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${priorityColor(task.priority)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>{task.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(task.status)}`}>{task.status}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{task.category}</span>
            {task.due_date && <span className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>Due {formatDate(task.due_date)}</span>}
            {task.assigned_to && <span className="text-xs text-gray-500">→ {task.assigned_to}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-500 mt-0.5 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 mt-0.5 shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/40">
          {task.notes && <p className="text-sm text-gray-400 mt-3 whitespace-pre-wrap">{task.notes}</p>}
          <div className="flex gap-2 mt-4 flex-wrap">
            {TASK_STATUSES.filter(s => s !== task.status).map(s => (
              <button key={s} onClick={() => onStatusChange(task.id, s)} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg border border-gray-700/60 hover:bg-gray-800">
                → {s}
              </button>
            ))}
            <button onClick={() => onEdit(task)} className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1 rounded-lg border border-violet-800/40">Edit</button>
            <button onClick={() => onDelete(task.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg border border-red-900/40">Delete</button>
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

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  async function updateStatus(id, status) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    load()
  }

  const filtered = tasks.filter(t => {
    const matchCat = filterCat === 'All' || t.category === filterCat
    const matchPri = filterPri === 'All' || t.priority === filterPri
    const matchStatus = filterStatus === 'All' ? true
      : filterStatus === 'Active' ? t.status !== 'Done'
      : t.status === filterStatus
    return matchCat && matchPri && matchStatus
  })

  const grouped = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(t => t.status === s)
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ministry pipeline & to-dos</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-sm px-3 py-2 rounded-lg font-medium">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none shrink-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="Active">Active</option>
          <option value="All">All Status</option>
          {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none shrink-0" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none shrink-0" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
          <option value="All">All Priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No tasks found.</p>
          <button onClick={() => setModal('new')} className="text-violet-400 text-sm mt-2 hover:underline">Add your first task</button>
        </div>
      ) : (
        <div className="space-y-5">
          {TASK_STATUSES.map(s => grouped[s]?.length > 0 && (
            <div key={s}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{s} · {grouped[s].length}</h3>
              <div className="space-y-2">
                {grouped[s].map(t => (
                  <TaskCard key={t.id} task={t} onEdit={t => setModal(t)} onDelete={deleteTask} onStatusChange={updateStatus} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <TaskForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
