import { useEffect, useState } from 'react'
import { supabase, SUPABASE_SCHEMA } from '../../lib/supabase'
import { useTheme } from '../../hooks/useTheme'
import { Eye, EyeOff, Copy, Check, Sun, Moon } from 'lucide-react'

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

export default function Settings() {
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState({ claude_api_key: '', user_name: 'Theo', timezone: 'Africa/Accra', phone_number: '' })
  const [settingsId, setSettingsId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) {
          setSettingsId(data.id)
          setForm({ claude_api_key: data.claude_api_key || '', user_name: data.user_name || 'Theo', timezone: data.timezone || 'Africa/Accra', phone_number: data.phone_number || '' })
        }
      })
  }, [])

  async function save() {
    setSaving(true)
    const payload = { claude_api_key: form.claude_api_key, user_name: form.user_name, timezone: form.timezone, phone_number: form.phone_number }
    if (settingsId) await supabase.from('settings').update(payload).eq('id', settingsId)
    else { const { data } = await supabase.from('settings').insert(payload).select().single(); if (data) setSettingsId(data.id) }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function copySchema() {
    navigator.clipboard.writeText(SUPABASE_SCHEMA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

      {/* Groq API */}
      <Section title="Groq API Key" subtitle="Required to use the AI Assistant. Get your free key at console.groq.com">
        <Field label="API Key">
          <div style={{ position: 'relative' }}>
            <input
              className="ksm-input"
              type={showKey ? 'text' : 'password'}
              value={form.claude_api_key}
              onChange={e => set('claude_api_key', e.target.value)}
              placeholder="gsk_…"
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
