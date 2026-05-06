import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate, isOverdue, PROJECT_STATUSES } from '../../lib/utils'
import { Plus, X, ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2 } from 'lucide-react'

const EMPTY = { name: '', description: '', owner: '', start_date: '', target_date: '', status: 'Planning', notes: '' }

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

function statusStyle(s) {
  if (s === 'Active') return { color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' }
  if (s === 'Planning') return { color: 'var(--accent-blue)', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' }
  if (s === 'On hold') return { color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' }
  return { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' }
}

function ProjectForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description, owner: form.owner, start_date: form.start_date || null, target_date: form.target_date || null, status: form.status, notes: form.notes }
    if (initial?.id) await supabase.from('vision_projects').update(payload).eq('id', initial.id)
    else await supabase.from('vision_projects').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Project Name *"><input className="ksm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Initiative name" /></Field>
      <Field label="Description"><textarea className="ksm-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the vision" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Owner"><input className="ksm-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Officer name" /></Field>
        <Field label="Status"><select className="ksm-input" value={form.status} onChange={e => set('status', e.target.value)}>{PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Start Date"><input type="date" className="ksm-input" value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
        <Field label="Target Date"><input type="date" className="ksm-input" value={form.target_date} onChange={e => set('target_date', e.target.value)} /></Field>
      </div>
      <Field label="Notes & Updates"><textarea className="ksm-input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Progress notes, blockers, updates…" /></Field>
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary" style={{ flex: 1 }}>{saving ? 'Saving…' : 'Save'}</button>
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
    await supabase.from('project_milestones').insert({ project_id: projectId, title: newTitle.trim(), due_date: newDate || null })
    setNewTitle(''); setNewDate(''); setAdding(false); load()
  }
  async function toggle(id, completed) { await supabase.from('project_milestones').update({ completed: !completed }).eq('id', id); load() }
  async function remove(id) { await supabase.from('project_milestones').delete().eq('id', id); load() }

  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Milestones</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 group">
            <button onClick={() => toggle(m.id, m.completed)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {m.completed
                ? <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                : <Circle size={16} style={{ color: m.due_date && isOverdue(m.due_date) ? 'var(--accent-red)' : 'var(--text-muted)' }} />
              }
            </button>
            <span style={{ flex: 1, fontSize: 13, color: m.completed ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
            {m.due_date && <span style={{ fontSize: 11, color: m.completed ? 'var(--text-muted)' : m.due_date && isOverdue(m.due_date) ? 'var(--accent-red)' : 'var(--text-muted)', flexShrink: 0 }}>{formatDate(m.due_date)}</span>}
            <button onClick={() => remove(m.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0, flexShrink: 0, padding: 2 }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="ksm-input" style={{ fontSize: 12, padding: '6px 10px' }} placeholder="Milestone title" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
          <input type="date" className="ksm-input" style={{ fontSize: 12, padding: '6px 10px', minWidth: 130 }} value={newDate} onChange={e => setNewDate(e.target.value)} />
          <button onClick={add} className="btn-primary" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>Add</button>
          <button onClick={() => setAdding(false)} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Add milestone
        </button>
      )}
    </div>
  )
}

function ProjectCard({ project, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const ps = statusStyle(project.status)

  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <button className="w-full text-left" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{project.name}</span>
            <span className="badge" style={{ color: ps.color, borderColor: ps.border, background: ps.bg }}>{project.status}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            {project.owner && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Owner: {project.owner}</p>}
            {project.target_date && <p style={{ fontSize: 12, color: isOverdue(project.target_date) && project.status !== 'Complete' ? 'var(--accent-red)' : 'var(--text-muted)' }}>Target: {formatDate(project.target_date)}</p>}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {project.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>{project.description}</p>}
          {project.start_date && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Started: {formatDate(project.start_date)}</p>}
          {project.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, whiteSpace: 'pre-wrap', paddingTop: 12, borderTop: '1px solid var(--border)' }}>{project.notes}</p>}
          <MilestoneList projectId={project.id} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEdit(project)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>Edit</button>
            <button onClick={() => onDelete(project.id)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', color: 'var(--accent-red)', background: 'transparent', cursor: 'pointer' }}>Delete</button>
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

  async function deleteProject(id) { if (!confirm('Delete this project and all its milestones?')) return; await supabase.from('vision_projects').delete().eq('id', id); load() }

  const filtered = filterStatus === 'All' ? projects : projects.filter(p => p.status === filterStatus)

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>
      <div className="page-header">
        <div><h2 className="page-title">Vision Projects</h2><p className="page-subtitle">Ministry initiatives & milestones</p></div>
        <button onClick={() => setModal('new')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Plus size={15} /> Add</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="ksm-input" style={{ width: 'auto', minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</p>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14 }}>No projects found.</p>
            <button onClick={() => setModal('new')} style={{ color: 'var(--accent)', fontSize: 13, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first project</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(p => <ProjectCard key={p.id} project={p} onEdit={p => setModal(p)} onDelete={deleteProject} />)}
          </div>
        )
      }

      {modal && (
        <Modal title={modal === 'new' ? 'Add Project' : 'Edit Project'} onClose={() => setModal(null)}>
          <ProjectForm initial={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
