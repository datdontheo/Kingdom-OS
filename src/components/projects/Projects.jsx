import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PROJECT_STATUSES, today } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2 } from 'lucide-react'

const EMPTY_PROJECT = {
  name: '', description: '', owner: '', start_date: '', target_date: '',
  status: 'Planning', notes: ''
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

function statusColor(s) {
  return s === 'Active' ? 'text-green-300 bg-green-950/40 border-green-800/40'
    : s === 'Planning' ? 'text-blue-300 bg-blue-950/40 border-blue-800/40'
    : s === 'On hold' ? 'text-amber-300 bg-amber-950/40 border-amber-800/40'
    : 'text-gray-400 bg-gray-800/40 border-gray-700/40'
}

function ProjectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_PROJECT)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description,
      owner: form.owner,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      status: form.status,
      notes: form.notes,
    }
    if (initial?.id) {
      await supabase.from('vision_projects').update(payload).eq('id', initial.id)
    } else {
      await supabase.from('vision_projects').insert(payload)
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="space-y-4">
      <Field label="Project Name *">
        <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Initiative name" />
      </Field>
      <Field label="Description">
        <textarea className={inputCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the vision" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner / Responsible Officer">
          <input className={inputCls} value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Officer name" />
        </Field>
        <Field label="Status">
          <select className={inputCls + ' cursor-pointer'} value={form.status} onChange={e => set('status', e.target.value)}>
            {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date">
          <input type="date" className={inputCls} value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </Field>
        <Field label="Target Date">
          <input type="date" className={inputCls} value={form.target_date} onChange={e => set('target_date', e.target.value)} />
        </Field>
      </div>
      <Field label="Notes & Updates">
        <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Progress notes, blockers, updates…" />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
        <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function MilestoneList({ projectId }) {
  const [milestones, setMilestones] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    const { data } = await supabase.from('project_milestones').select('*').eq('project_id', projectId).order('due_date')
    setMilestones(data || [])
  }

  useEffect(() => { load() }, [projectId])

  async function add() {
    if (!newTitle.trim()) return
    await supabase.from('project_milestones').insert({
      project_id: projectId, title: newTitle.trim(), due_date: newDate || null
    })
    setNewTitle('')
    setNewDate('')
    setAdding(false)
    load()
  }

  async function toggle(id, completed) {
    await supabase.from('project_milestones').update({ completed: !completed }).eq('id', id)
    load()
  }

  async function remove(id) {
    await supabase.from('project_milestones').delete().eq('id', id)
    load()
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 font-medium mb-2">Milestones</p>
      <div className="space-y-1.5">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 group">
            <button onClick={() => toggle(m.id, m.completed)} className="shrink-0">
              {m.completed
                ? <CheckCircle2 size={16} className="text-green-400" />
                : <Circle size={16} className={`${m.due_date && isOverdue(m.due_date) ? 'text-red-400' : 'text-gray-600'}`} />
              }
            </button>
            <span className={`flex-1 text-sm ${m.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>{m.title}</span>
            {m.due_date && (
              <span className={`text-xs shrink-0 ${m.completed ? 'text-gray-600' : m.due_date && isOverdue(m.due_date) ? 'text-red-400' : 'text-gray-500'}`}>
                {formatDate(m.due_date)}
              </span>
            )}
            <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-600/60"
            placeholder="Milestone title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            autoFocus
          />
          <input
            type="date"
            className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <button onClick={add} className="text-xs bg-violet-700 hover:bg-violet-600 text-white px-2 py-1.5 rounded-lg">Add</button>
          <button onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
          <Plus size={12} /> Add milestone
        </button>
      )}
    </div>
  )
}

function ProjectCard({ project, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl overflow-hidden">
      <button className="w-full text-left px-4 py-3.5 flex items-start gap-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">{project.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(project.status)}`}>{project.status}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {project.owner && <p className="text-xs text-gray-500">Owner: {project.owner}</p>}
            {project.target_date && (
              <p className={`text-xs ${isOverdue(project.target_date) && project.status !== 'Complete' ? 'text-red-400' : 'text-gray-500'}`}>
                Target: {formatDate(project.target_date)}
              </p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={15} className="text-gray-500 shrink-0 mt-0.5" /> : <ChevronDown size={15} className="text-gray-500 shrink-0 mt-0.5" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800/40">
          {project.description && <p className="text-sm text-gray-400 mt-3">{project.description}</p>}
          {project.start_date && <p className="text-xs text-gray-500 mt-2">Started: {formatDate(project.start_date)}</p>}
          {project.notes && <p className="text-sm text-gray-400 mt-3 whitespace-pre-wrap border-t border-gray-800/40 pt-3">{project.notes}</p>}
          <MilestoneList projectId={project.id} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(project)} className="text-xs text-violet-400 px-3 py-1.5 rounded-lg border border-violet-800/40">Edit</button>
            <button onClick={() => onDelete(project.id)} className="text-xs text-red-400 px-3 py-1.5 rounded-lg border border-red-900/40">Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')

  async function load() {
    const { data } = await supabase.from('vision_projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function deleteProject(id) {
    if (!confirm('Delete this project and all its milestones?')) return
    await supabase.from('vision_projects').delete().eq('id', id)
    load()
  }

  const filtered = filterStatus === 'All' ? projects : projects.filter(p => p.status === filterStatus)

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Vision Projects</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ministry initiatives & milestones</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-1.5 bg-violet-700 hover:bg-violet-600 text-white text-sm px-3 py-2 rounded-lg font-medium">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <select className="bg-gray-800/60 border border-gray-700/60 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none shrink-0" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No projects found.</p>
          <button onClick={() => setModal('new')} className="text-violet-400 text-sm mt-2 hover:underline">Add your first project</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={p => setModal(p)} onDelete={deleteProject} />
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'new' ? 'Add Project' : 'Edit Project'} onClose={() => setModal(null)}>
          <ProjectForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
