import { useEffect, useState } from 'react'
import { supabase, SUPABASE_SCHEMA } from '../../lib/supabase'
import { useTheme } from '../../hooks/useTheme'
import { Eye, EyeOff, Copy, Check, Sun, Moon, Plus, Trash2, FileText, Brain, ToggleLeft, ToggleRight } from 'lucide-react'

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

const DOC_TYPES = ['Vision', 'Doctrine', 'Programme', 'Constitution', 'Other']
const MEMORY_CATEGORIES = ['observation', 'preference', 'instruction', 'pattern']

export default function Settings() {
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({ claude_api_key: '', user_name: 'Theo', timezone: 'Africa/Accra', phone_number: '' })
  const [settingsId, setSettingsId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Ministry Documents state
  const [docs, setDocs] = useState([])
  const [showDocForm, setShowDocForm] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', content: '', doc_type: 'Vision' })
  const [savingDoc, setSavingDoc] = useState(false)
  const setDoc = (k, v) => setNewDoc(d => ({ ...d, [k]: v }))

  // Assistant Memory state
  const [memories, setMemories] = useState([])
  const [showMemoryForm, setShowMemoryForm] = useState(false)
  const [newMemory, setNewMemory] = useState({ key: '', value: '', category: 'observation' })
  const [savingMemory, setSavingMemory] = useState(false)
  const setMem = (k, v) => setNewMemory(m => ({ ...m, [k]: v }))

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) {
          setSettingsId(data.id)
          setForm({ claude_api_key: data.claude_api_key || '', user_name: data.user_name || 'Theo', timezone: data.timezone || 'Africa/Accra', phone_number: data.phone_number || '' })
        }
      })
    loadDocs()
    loadMemories()
  }, [])

  async function loadDocs() {
    const { data } = await supabase.from('ministry_documents').select('*').order('created_at', { ascending: true })
    setDocs(data || [])
  }

  async function loadMemories() {
    const { data } = await supabase.from('assistant_memory').select('*').order('updated_at', { ascending: false })
    setMemories(data || [])
  }

  async function save() {
    setSaving(true)
    setSaveError('')
    try {
      const payload = { claude_api_key: form.claude_api_key, user_name: form.user_name, timezone: form.timezone, phone_number: form.phone_number }
      let error
      if (settingsId) {
        ;({ error } = await supabase.from('settings').update(payload).eq('id', settingsId))
      } else {
        const result = await supabase.from('settings').insert(payload).select().single()
        error = result.error
        if (result.data) setSettingsId(result.data.id)
      }
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err.message || 'Save failed. Check your Supabase connection.')
    } finally {
      setSaving(false)
    }
  }

  function copySchema() {
    navigator.clipboard.writeText(SUPABASE_SCHEMA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveDoc() {
    if (!newDoc.title.trim() || !newDoc.content.trim()) return
    setSavingDoc(true)
    await supabase.from('ministry_documents').insert({ title: newDoc.title.trim(), content: newDoc.content.trim(), doc_type: newDoc.doc_type, active: true })
    setNewDoc({ title: '', content: '', doc_type: 'Vision' })
    setShowDocForm(false)
    setSavingDoc(false)
    loadDocs()
  }

  async function deleteDoc(id) {
    await supabase.from('ministry_documents').delete().eq('id', id)
    loadDocs()
  }

  async function toggleDocActive(doc) {
    await supabase.from('ministry_documents').update({ active: !doc.active }).eq('id', doc.id)
    loadDocs()
  }

  async function saveMemory() {
    if (!newMemory.key.trim() || !newMemory.value.trim()) return
    setSavingMemory(true)
    await supabase.from('assistant_memory').insert({ key: newMemory.key.trim(), value: newMemory.value.trim(), category: newMemory.category, source: 'manual' })
    setNewMemory({ key: '', value: '', category: 'observation' })
    setShowMemoryForm(false)
    setSavingMemory(false)
    loadMemories()
  }

  async function deleteMemory(id) {
    await supabase.from('assistant_memory').delete().eq('id', id)
    loadMemories()
  }

  const categoryColour = { observation: 'var(--accent-blue)', preference: 'var(--accent)', instruction: 'var(--accent-amber)', pattern: 'var(--accent-green, #4ade80)' }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure your Kingdom OS instance</p>
      </div>

      {/* Appearance */}
      <Section title="Appearance" subtitle="Choose your preferred theme">
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => theme !== 'dark' && toggle()}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${theme === 'dark' ? 'var(--border-glow)' : 'var(--border)'}`, background: theme === 'dark' ? 'var(--accent-dim)' : 'transparent', color: theme === 'dark' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
            <Moon size={16} /> Dark
          </button>
          <button onClick={() => theme !== 'light' && toggle()}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${theme === 'light' ? 'var(--border-glow)' : 'var(--border)'}`, background: theme === 'light' ? 'var(--accent-dim)' : 'transparent', color: theme === 'light' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>
            <Sun size={16} /> Light
          </button>
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Your Name">
          <input className="ksm-input" value={form.user_name} onChange={e => set('user_name', e.target.value)} placeholder="Theo" />
        </Field>
        <Field label="Your WhatsApp Number" hint="Used to send reminders to yourself via WhatsApp">
          <input className="ksm-input" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+233244123456" />
        </Field>
        <Field label="Timezone" hint="Fixed to Africa/Accra (GMT)">
          <input className="ksm-input" value={form.timezone} readOnly style={{ opacity: 0.6 }} />
        </Field>
      </Section>

      {/* Claude API */}
      <Section title="Claude API Key" subtitle="Required to use the AI Assistant. Get your key at console.anthropic.com">
        <Field label="API Key">
          <div style={{ position: 'relative' }}>
            <input
              className="ksm-input"
              type={showKey ? 'text' : 'password'}
              value={form.claude_api_key}
              onChange={e => set('claude_api_key', e.target.value)}
              placeholder="sk-ant-…"
              style={{ paddingRight: 40 }}
            />
            <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
      </Section>

      {/* Save */}
      <button onClick={save} disabled={saving} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : 'Save Settings'}
      </button>
      {saveError && (
        <p style={{ fontSize: 12, color: 'var(--accent-red)', textAlign: 'center', padding: '8px 12px', background: 'rgba(239,83,80,0.08)', borderRadius: 8, border: '1px solid rgba(239,83,80,0.2)' }}>
          {saveError}
        </p>
      )}

      {/* Ministry Documents */}
      <Section title="Ministry Documents" subtitle="Paste content from any ministry document. The assistant will always have this as reference context.">
        {docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', opacity: doc.active ? 1 : 0.5 }}>
                <FileText size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{doc.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.doc_type} · {doc.content.length} chars · {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => toggleDocActive(doc)} title={doc.active ? 'Disable' : 'Enable'} style={{ color: doc.active ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
                  {doc.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => deleteDoc(doc.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showDocForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border-glow)' }}>
            <input className="ksm-input" value={newDoc.title} onChange={e => setDoc('title', e.target.value)} placeholder="Document title (e.g. KSM Vision Statement)" />
            <select className="ksm-input" value={newDoc.doc_type} onChange={e => setDoc('doc_type', e.target.value)}>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea
              className="ksm-input"
              value={newDoc.content}
              onChange={e => setDoc('content', e.target.value)}
              placeholder="Paste document content here…"
              rows={6}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDocForm(false)} className="btn-ghost" style={{ flex: 1, fontSize: 13 }}>Cancel</button>
              <button onClick={saveDoc} disabled={savingDoc || !newDoc.title.trim() || !newDoc.content.trim()} className="btn-primary" style={{ flex: 1, fontSize: 13 }}>
                {savingDoc ? 'Saving…' : 'Save Document'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDocForm(true)} className="btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Document
          </button>
        )}
      </Section>

      {/* Assistant Memory */}
      <Section title="Assistant Memory" subtitle="Key facts the assistant remembers across conversations. The AI adds to this automatically — you can also add or remove entries.">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 10px', background: 'var(--accent-dim)', borderRadius: 8, border: '1px solid var(--border-glow)' }}>
          The assistant stores important observations here automatically. These are injected into every conversation so it never forgets.
        </p>

        {memories.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {memories.map(mem => (
              <div key={mem.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <Brain size={14} style={{ color: categoryColour[mem.category] || 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{mem.key}</p>
                    <span style={{ fontSize: 10, fontWeight: 600, color: categoryColour[mem.category] || 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mem.category}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{mem.source === 'ai' ? '🤖 AI' : '✍️ Manual'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mem.value}</p>
                </div>
                <button onClick={() => deleteMemory(mem.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {memories.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No memories stored yet. The assistant will add entries as it learns from your conversations.</p>
        )}

        {showMemoryForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 10, background: 'var(--bg-base)', border: '1px solid var(--border-glow)' }}>
            <input className="ksm-input" value={newMemory.key} onChange={e => setMem('key', e.target.value)} placeholder="Short label (e.g. Kofi availability)" />
            <textarea
              className="ksm-input"
              value={newMemory.value}
              onChange={e => setMem('value', e.target.value)}
              placeholder="What should the assistant remember?"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
            <select className="ksm-input" value={newMemory.category} onChange={e => setMem('category', e.target.value)}>
              {MEMORY_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowMemoryForm(false)} className="btn-ghost" style={{ flex: 1, fontSize: 13 }}>Cancel</button>
              <button onClick={saveMemory} disabled={savingMemory || !newMemory.key.trim() || !newMemory.value.trim()} className="btn-primary" style={{ flex: 1, fontSize: 13 }}>
                {savingMemory ? 'Saving…' : 'Save Memory'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowMemoryForm(true)} className="btn-ghost" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Memory
          </button>
        )}
      </Section>

      {/* Database */}
      <Section title="Database Setup" subtitle="If your Supabase tables aren't created yet, copy this SQL and run it in your Supabase SQL editor.">
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowSql(!showSql)} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
            {showSql ? 'Hide SQL' : 'Show SQL'}
          </button>
          <button onClick={copySchema} className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy SQL</>}
          </button>
        </div>
        {showSql && (
          <pre style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, fontSize: 11, color: 'var(--text-secondary)', overflow: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {SUPABASE_SCHEMA.trim()}
          </pre>
        )}
      </Section>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <p>Kingdom OS · Kingdom Seekers Ministry</p>
        <p>Accra & Cape Coast, Ghana · Est. December 2021</p>
      </div>
    </div>
  )
}
