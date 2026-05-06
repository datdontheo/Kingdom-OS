import { useEffect, useState } from 'react'
import { supabase, SUPABASE_SCHEMA } from '../../lib/supabase'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'

const inputCls = 'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-600/60'

export default function Settings() {
  const [form, setForm] = useState({ claude_api_key: '', user_name: 'Theo', timezone: 'Africa/Accra' })
  const [settingsId, setSettingsId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSql, setShowSql] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) {
          setSettingsId(data.id)
          setForm({
            claude_api_key: data.claude_api_key || '',
            user_name: data.user_name || 'Theo',
            timezone: data.timezone || 'Africa/Accra',
          })
        }
      })
  }, [])

  async function save() {
    setSaving(true)
    const payload = {
      claude_api_key: form.claude_api_key,
      user_name: form.user_name,
      timezone: form.timezone,
    }
    if (settingsId) {
      await supabase.from('settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('settings').insert(payload).select().single()
      if (data) setSettingsId(data.id)
    }
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
    <div className="max-w-xl mx-auto px-4 pt-6 pb-10 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Configure your Kingdom OS instance</p>
      </div>

      {/* Profile */}
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Profile</h3>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Your Name</label>
          <input
            className={inputCls}
            value={form.user_name}
            onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
            placeholder="Theo"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Timezone</label>
          <input
            className={inputCls}
            value={form.timezone}
            readOnly
          />
          <p className="text-xs text-gray-600">Fixed to Africa/Accra (GMT)</p>
        </div>
      </div>

      {/* Claude API */}
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-300">DeepSeek API Key</h3>
          <p className="text-xs text-gray-500 mt-1">Required to use the AI Assistant. Get your key from platform.deepseek.com/api-keys</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">API Key</label>
          <div className="relative">
            <input
              className={inputCls + ' pr-10'}
              type={showKey ? 'text' : 'password'}
              value={form.claude_api_key}
              onChange={e => setForm(f => ({ ...f, claude_api_key: e.target.value }))}
              placeholder="sk-…"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-600">Stored securely in your Supabase database.</p>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : 'Save Settings'}
      </button>

      {/* Database setup */}
      <div className="bg-gray-900/60 border border-gray-800/60 rounded-xl p-5 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-300">Database Setup</h3>
          <p className="text-xs text-gray-500 mt-1">If you haven't created the Supabase tables yet, copy this SQL and run it in your Supabase SQL editor.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-800/40"
          >
            {showSql ? 'Hide SQL' : 'Show SQL'}
          </button>
          <button
            onClick={copySchema}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700/60"
          >
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy SQL</>}
          </button>
        </div>
        {showSql && (
          <pre className="bg-gray-950/60 border border-gray-800/40 rounded-lg p-3 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {SUPABASE_SCHEMA.trim()}
          </pre>
        )}
      </div>

      {/* About */}
      <div className="text-center text-xs text-gray-600 space-y-0.5">
        <p>Kingdom OS · Kingdom Seekers Ministry</p>
        <p>Accra & Cape Coast, Ghana · Est. December 2021</p>
      </div>
    </div>
  )
}
