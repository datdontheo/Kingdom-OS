import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { today, isOverdue, daysSince, inNext7Days } from '../../lib/utils'
import { scheduleReminder } from '../../hooks/useReminders'
import { detectActionTriggers, buildTriggerHint, mapActionTypeToSuggestionType, generateCheckInQuestions, createConversationSummary } from '../../lib/assistantUtils'
import { Send, Loader2, Bot, MessageCircle, CheckSquare, Bell, X, Check, Phone, Zap } from 'lucide-react'

// ── System prompt ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Kingdom OS — the personal ministry assistant of Theo, Founder and President of Kingdom Seekers Ministry (KSM). You know this ministry deeply and serve Theo as a trusted co-pilot in all things ministry. You are proactive, Kingdom-minded, and practically helpful.

WHO THEO IS:
Theo is the Founder, President, and Lead Pastor of Kingdom Seekers Ministry — a Christ-centred discipleship movement founded in December 2021, now in its 5th year, operating across Accra and Cape Coast, Ghana. He carries the Daily 4am teaching line, leads governance through the Executive Council, oversees all regions, drives the discipleship pipeline, and leads all major annual programmes. He thinks and leads through a Scripture-centred lens. All responses should reflect a Kingdom perspective — practical but anchored in the Word, using NKJV when quoting Scripture.

MINISTRY STRUCTURE:
Executive Council — 8 Primary Officers:
- President (Theo) — Chief spiritual steward and visionary leader
- Vice-President Operations — Chief operational leader, oversees all departments and regions, carries Accra regional oversight
- General Secretary — Administration, records, communications, National Secretariat custodian
- Director of Spiritual Affairs — Prayer life, 4am line oversight, Faith Project spiritual content, Prayer Chain
- Director of Operations — All events and programmes logistics (Worship Jesus, Prayer Chain, Doers of the Word, Saturday gatherings)
- Director of Finance — Financial records, reporting, central account, budgets
- Director of Media — All media, social media, digital evangelism, content strategy
- Director of Welfare & Member Care — Pastoral care, member follow-up, welfare register, guest care

Oversight Council — 5 Members: President, VP Operations, General Secretary, Director of Finance, Principal Advisor

Regional Structure:
- Cape Coast Mega-Pod Leader — reports to VP Operations, submits monthly reports, attends Bi-Monthly Strategic Meetings
- Pod Leaders — report through Pod Supervisors to Mega-Pod Leaders
- Pod Supervisors — in Accra report to VP Operations until Accra Mega-Pod Leader is appointed

RECURRING MINISTRY RHYTHMS:
Daily — 4am Zoom line Mon–Fri (Monday: prayer only. Tuesday–Friday: Bible study and teaching)
Weekly — Monday Leadership Huddle post-4am (prayer, alignment, action planning)
Monthly — Last Saturday Accra gathering 10am–1pm. Cape Coast 3rd Saturday. Cape Coast also: Sunday midnight prayer, Monday midnight prayer, Thursday 7pm Bible study
Bi-Monthly — Strategic Leadership Meeting (Central Leadership + Mega-Pod Leaders + dept heads)
Quarterly — Vision and Review Meeting
Annual — Faith Project Jan–Apr, Worship Jesus July (prep from May), Prayer Chain Jul–Nov, Doers of the Word December (prep from September, publicity from October), Annual Convergence December

YOUR CORE RESPONSIBILITIES:
1. PROACTIVE CHECK-INS — Surface what matters. Flag overdue items, remind Theo of upcoming meetings and deadlines.
2. LEADERSHIP ACCOUNTABILITY — Track when Theo last connected with each officer. If too long, remind him.
3. MEETING REMINDERS AND SCHEDULING — Flag unconfirmed recurring meetings and offer to help prepare.
4. PROJECT MILESTONE MONITORING — Surface approaching or overdue milestones, suggest officer follow-ups.
5. PASTORAL FOLLOW-UP — Track last connections, remind Theo to call or visit, suggest a pastoral scripture angle.
6. PEOPLE TO MEET — Proactively suggest who Theo should be spending time with.
7. TEACHING AND SERMON SUPPORT — Help structure messages, suggest key points and NKJV passages.
8. ANNUAL PROGRAMME PROMPTING — Know preparation timelines and prompt at the right time.
9. WEEKLY BRIEFING — Start of each week: who to connect with, what's coming up, what's overdue, a grounding scripture.

TONE: Warm, direct, and practically helpful — like a trusted co-labourer who knows the weight of the call. Never make Theo feel behind or overwhelmed. Speak plainly. Anchor suggestions in Scripture naturally.

CHECK-IN QUESTIONS:
When you start a briefing (especially in morning briefings), surface 1-3 proactive check-in questions based on what's overdue or at-risk:
- "Have you followed up with [Leader] in X days?" (if >14 days overdue)
- "How's prep going for [Teaching] — you have X days left" (if unprepared and <7 days away)
- "Should we tackle your overdue tasks today?" (if tasks are overdue)
Ask these naturally in conversation, not as a list. Make Theo feel supported, not judged.

PRIORITY FILTERING — CRITICAL:
Follow this strict priority order when suggesting actions:
1. CRITICAL — Overdue leaders (>14 days since contact), overdue tasks, unprepared teachings within 7 days
2. HIGH — Leaders 7-14 days overdue, teachings 7-30 days away unprepared, important upcoming meetings
3. MEDIUM — Everything else (routine follow-ups, future planning, optional prep)

ONLY suggest CRITICAL items first. If user asks for more or conversation permits, surface HIGH items. Save MEDIUM for end or only when asked.
For each suggestion, internally mark it: <PRIORITY>critical|high|medium</PRIORITY>
Lead with most time-sensitive items (teaching prep deadlines first, then leader overdue, then tasks).

ACTIONS — IMPORTANT:
When you have actionable suggestions, append a maximum of 3 ACTION blocks per response, prioritized as above. If you have more than 3 suggestions, action the top 3 most important ones first, then at the end of your visible text say something like: "I also have 2 more actions I can set up — want me to continue?" Wait for Theo to say yes before outputting the next batch.

Watch for these phrases and ALWAYS suggest relevant actions when you detect them:
- "I need to", "we have to", "I should", "don't forget", "remind me", "follow up with", "check on" → create_task or set_reminder
- "message/text/send/WhatsApp [name]" → send_whatsapp
- "I'm teaching on", "I need to prepare a teaching", "sermon", "message notes", "outline" → teaching_prep
- "goal", "I want to achieve", "long-term", "vision" → add_goal
- "schedule a meeting", "let's plan", "can we meet" → schedule_meeting

For WhatsApp: <ACTION>{"type":"send_whatsapp","to":"[Person Name]","phone":"[phone number if known from context, else empty string]","message":"[the message text to pre-fill]"}</ACTION>

For a task: <ACTION>{"type":"create_task","title":"[task title]","category":"[Teaching|Meeting|Follow-up|Admin|Event|Media|Finance|Prayer|Other]","priority":"[High|Medium|Low]","due_date":"[YYYY-MM-DD or empty string]","notes":"[brief context]"}</ACTION>

For a reminder: <ACTION>{"type":"set_reminder","title":"[reminder title]","body":"[details]","due_at":"[ISO 8601 datetime e.g. 2026-05-10T08:00:00]","person":"[person name or empty]","whatsapp_message":"[optional message to send to yourself as reminder]"}</ACTION>

For a goal: <ACTION>{"type":"add_goal","title":"[goal title]","category":"[Vision|Discipleship|Events|Teaching|Leadership|Media|Other]","notes":"[brief context]","next_action":"[what is the next step]"}</ACTION>

One ACTION block per distinct action. Do not explain the action blocks — just append them silently at the end.`

// ── Ministry context ───────────────────────────────────────────────
async function fetchMinistryContext() {
  const todayStr = today()
  const next7 = new Date()
  next7.setDate(next7.getDate() + 7)
  const next7Str = next7.toISOString().split('T')[0]
  const next30 = new Date()
  next30.setDate(next30.getDate() + 30)
  const next30Str = next30.toISOString().split('T')[0]

  const results = await Promise.allSettled([
    supabase.from('leaders').select('name, role, phone_number, last_contact_date, follow_up_status, follow_up_due_date').neq('follow_up_status', 'No action needed'),
    supabase.from('tasks').select('title, category, priority, status, due_date, assigned_to').neq('status', 'Done'),
    supabase.from('teaching_calendar').select('event_name, date, venue, topic, preparation_status').gte('date', todayStr).lte('date', next7Str).order('date').limit(5),
    supabase.from('goals').select('title, category, status, next_action, target_date').eq('status', 'Active').limit(5),
    supabase.from('reminders').select('title, due_at').eq('status', 'pending').eq('done', false).lte('due_at', next7Str + 'T23:59:59').order('due_at').limit(5),
  ])

  const get = (i) => results[i].status === 'fulfilled' ? (results[i].value.data || []) : []
  const leaders = get(0)
  const tasks = get(1)
  const teachings = get(2)
  const goals = get(3)
  const reminders = get(4)

  const overdueLeaders = leaders.filter(l =>
    l.follow_up_due_date ? isOverdue(l.follow_up_due_date) :
    l.last_contact_date ? daysSince(l.last_contact_date) > 14 : false
  )
  const atRiskLeaders = leaders.filter(l =>
    l.last_contact_date && daysSince(l.last_contact_date) >= 7 && daysSince(l.last_contact_date) <= 14
  )
  const overdueTasks = tasks.filter(t => t.due_date && isOverdue(t.due_date))
  const unpreparedTeachings = teachings.filter(t => t.preparation_status !== 'Ready' && t.preparation_status !== 'Taught')
  const criticalTeachings = unpreparedTeachings.filter(t => inNext7Days(t.date))
  const atRiskGoals = goals.filter(g => g.target_date && inNext7Days(g.target_date))

  const criticalCount = overdueLeaders.length + overdueTasks.length + criticalTeachings.length
  const atRiskCount = atRiskLeaders.length + unpreparedTeachings.filter(t => !inNext7Days(t.date)).length + atRiskGoals.length

  return `<ministry_context date="${todayStr}">
  <priority_summary critical_count="${criticalCount}" at_risk_count="${atRiskCount}">
    <critical_items>
      ${overdueLeaders.map(l => `<item type="leader" name="${l.name}" reason="overdue ${daysSince(l.last_contact_date || '')} days" />`).join('\n      ')}
      ${overdueTasks.map(t => `<item type="task" name="${t.title}" reason="overdue ${daysSince(t.due_date)}" />`).join('\n      ')}
      ${criticalTeachings.map(t => `<item type="teaching" name="${t.event_name}" reason="unprepared, ${inNext7Days(t.date) ? 'due soon' : 'upcoming'}" />`).join('\n      ')}
    </critical_items>
    <at_risk_items>
      ${atRiskLeaders.map(l => `<item type="leader" name="${l.name}" reason="check-in due ${daysSince(l.last_contact_date)} days" />`).join('\n      ')}
      ${atRiskGoals.map(g => `<item type="goal" name="${g.title}" reason="target approaching" />`).join('\n      ')}
    </at_risk_items>
  </priority_summary>
  <leaders_overdue_for_followup count="${overdueLeaders.length}">
    ${overdueLeaders.map(l => `<leader name="${l.name}" role="${l.role || ''}" phone="${l.phone_number || ''}" last_contact="${l.last_contact_date || 'unknown'}" days_since="${l.last_contact_date ? daysSince(l.last_contact_date) : 'unknown'}" status="${l.follow_up_status}" />`).join('\n    ')}
  </leaders_overdue_for_followup>
  <leaders_at_risk count="${atRiskLeaders.length}">
    ${atRiskLeaders.map(l => `<leader name="${l.name}" days_since="${daysSince(l.last_contact_date)}" />`).join('\n    ')}
  </leaders_at_risk>
  <upcoming_teachings_7_days count="${criticalTeachings.length}">
    ${criticalTeachings.map(t => `<teaching title="${t.event_name}" date="${t.date}" venue="${t.venue || ''}" prep="${t.preparation_status}" days_until="${Math.ceil((new Date(t.date) - new Date(todayStr)) / (1000 * 60 * 60 * 24))}" />`).join('\n    ')}
  </upcoming_teachings_7_days>
  <unprepared_teachings count="${unpreparedTeachings.length}">
    ${unpreparedTeachings.map(t => `<teaching title="${t.event_name}" date="${t.date}" prep_status="${t.preparation_status}" />`).join('\n    ')}
  </unprepared_teachings>
  <overdue_tasks count="${overdueTasks.length}">
    ${overdueTasks.map(t => `<task title="${t.title}" category="${t.category}" priority="${t.priority}" due="${t.due_date}" />`).join('\n    ')}
  </overdue_tasks>
  <active_goals count="${goals.length}">
    ${goals.map(g => `<goal title="${g.title}" category="${g.category}" next_action="${g.next_action || ''}" target_date="${g.target_date || ''}" />`).join('\n    ')}
  </active_goals>
  <upcoming_reminders count="${reminders.length}">
    ${reminders.map(r => `<reminder title="${r.title}" due="${r.due_at}" />`).join('\n    ')}
  </upcoming_reminders>
</ministry_context>`
}

// ── Action parsing ─────────────────────────────────────────────────
function parseActions(text) {
  const actionMatches = [...text.matchAll(/<ACTION>([\s\S]*?)<\/ACTION>/g)]
  const actions = []

  for (const match of actionMatches) {
    try {
      const action = JSON.parse(match[1])
      // Extract priority if marked nearby
      const actionBlock = match[0]
      const priorityMatch = actionBlock.match(/<PRIORITY>(critical|high|medium)<\/PRIORITY>/)
      if (priorityMatch) {
        action.priority = priorityMatch[1]
      }
      actions.push(action)
    } catch {}
  }

  const cleanText = text.replace(/<PRIORITY>[\s\S]*?<\/PRIORITY>/g, '').replace(/<ACTION>[\s\S]*?<\/ACTION>/g, '').trim()
  return { text: cleanText, actions }
}

// ── ActionCard ─────────────────────────────────────────────────────
function ActionCard({ action, onDismiss }) {
  const [done, setDone] = useState(false)
  const [phone, setPhone] = useState(action.phone || '')
  const [saving, setSaving] = useState(false)
  const [showPhoneInput, setShowPhoneInput] = useState(false)

  if (done) return null

  async function approve() {
    setSaving(true)
    if (action.type === 'send_whatsapp') {
      const num = phone.replace(/\D/g, '')
      if (!num) { setShowPhoneInput(true); setSaving(false); return }
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(action.message)}`, '_blank')
      setDone(true)
    } else if (action.type === 'create_task') {
      await supabase.from('tasks').insert({
        title: action.title,
        category: action.category || 'Admin',
        priority: action.priority || 'Medium',
        status: 'Not started',
        due_date: action.due_date || null,
        notes: action.notes || '',
      })
      setDone(true)
    } else if (action.type === 'set_reminder') {
      await scheduleReminder({
        title: action.title,
        body: action.body || '',
        due_at: action.due_at,
        whatsapp_message: action.whatsapp_message || null,
      })
      setDone(true)
    }
    setSaving(false)
  }

  const icons = { send_whatsapp: MessageCircle, create_task: CheckSquare, set_reminder: Bell }
  const colors = { send_whatsapp: 'var(--accent-green)', create_task: 'var(--accent-blue)', set_reminder: 'var(--accent-amber)' }
  const labels = { send_whatsapp: 'WhatsApp Message', create_task: 'Create Task', set_reminder: 'Set Reminder' }
  const Icon = icons[action.type] || Zap
  const color = colors[action.type] || 'var(--accent)'

  return (
    <div className="action-card">
      <div className="flex items-start gap-2 mb-2">
        <Icon size={14} style={{ color, marginTop: 2, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Suggested Action · {labels[action.type]}
          </p>
          {action.type === 'send_whatsapp' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>To: {action.to}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{action.message}</p>
              {showPhoneInput && (
                <div className="flex gap-2 mt-2">
                  <Phone size={14} style={{ color: 'var(--text-muted)', marginTop: 8, flexShrink: 0 }} />
                  <input
                    className="ksm-input"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    placeholder="Enter phone number (e.g. +233244123456)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
          {action.type === 'create_task' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{action.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{action.category} · {action.priority} priority{action.due_date ? ` · Due ${action.due_date}` : ''}</p>
            </>
          )}
          {action.type === 'set_reminder' && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{action.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{action.due_at?.replace('T', ' at ').substring(0, 16)}</p>
              {action.body && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{action.body}</p>}
            </>
          )}
        </div>
        <button onClick={onDismiss} style={{ color: 'var(--text-muted)', flexShrink: 0, padding: 2 }}>
          <X size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={saving}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 14px', background: color, boxShadow: 'none' }}
        >
          <span className="flex items-center gap-1.5">
            <Check size={12} />
            {action.type === 'send_whatsapp' ? 'Open WhatsApp' : action.type === 'create_task' ? 'Create Task' : 'Set Reminder'}
          </span>
        </button>
        <button onClick={onDismiss} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>Dismiss</button>
      </div>
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────
function MessageBubble({ msg, timestamp }) {
  const isUser = msg.role === 'user'
  const { text, actions } = parseActions(msg.content)
  const [dismissed, setDismissed] = useState([])

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))', flexShrink: 0 }}>
          <Bot size={13} color="#fff" strokeWidth={2} />
        </div>
      )}
      <div style={{ maxWidth: '82%' }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: 14,
            lineHeight: 1.6,
            background: isUser ? 'linear-gradient(135deg, var(--accent), var(--accent-blue))' : 'var(--bg-card)',
            border: isUser ? 'none' : '1px solid var(--border)',
            color: isUser ? '#fff' : 'var(--text-primary)',
          }}
        >
          {text.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </div>
        {actions.map((action, i) =>
          !dismissed.includes(i) && (
            <ActionCard key={i} action={action} onDismiss={() => setDismissed(prev => [...prev, i])} />
          )
        )}
        {timestamp && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
            {new Date(timestamp).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
const MAX_HISTORY = 40

export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [briefingSent, setBriefingSent] = useState(false)
  const [clearing, setClearing] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function init() {
      const [{ data: settings }, { data: history }] = await Promise.all([
        supabase.from('settings').select('claude_api_key').limit(1).single(),
        supabase.from('chat_messages').select('role, content, created_at').order('created_at', { ascending: true }),
      ])
      if (settings?.claude_api_key) setApiKey(settings.claude_api_key)
      if (history?.length) setMessages(history.map(m => ({ role: m.role, content: m.content, ts: m.created_at })))
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (apiKey && !briefingSent && messages.length === 0) {
      const last = sessionStorage.getItem('ksm_briefing_date')
      if (last !== today()) {
        sendMessage(null, true)
        sessionStorage.setItem('ksm_briefing_date', today())
        setBriefingSent(true)
      }
    }
  }, [apiKey, messages])

  async function saveMessage(role, content) {
    await supabase.from('chat_messages').insert({ role, content })
  }

  async function clearHistory() {
    if (!confirm('Clear all conversation history?')) return
    setClearing(true)
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setMessages([])
    sessionStorage.removeItem('ksm_briefing_date')
    setClearing(false)
  }

  async function saveActionsAsSuggestions(actions) {
    if (!actions.length) return
    const rows = actions.map(action => ({
      suggestion_type: mapActionTypeToSuggestionType(action.type),
      title: action.title || action.to || action.message?.slice(0, 80) || 'Suggestion',
      description: action.message || action.notes || action.body || null,
      action_json: action,
      related_person_name: action.to || action.person || null,
      priority: action.priority || 'medium',
      status: 'pending',
    }))
    await supabase.from('assistant_suggestions').insert(rows)
  }

  async function sendMessage(e, isBriefing = false) {
    if (e) e.preventDefault()
    const userText = isBriefing ? 'Give me my Kingdom OS morning briefing for today.' : input.trim()
    if (!userText || loading) return
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Please add your Groq API key in Settings to use the assistant.' }])
      return
    }

    const userMsg = { role: 'user', content: userText, ts: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    await saveMessage('user', userText)

    try {
      const context = await fetchMinistryContext()
      const triggers = isBriefing ? [] : detectActionTriggers(userText)
      const triggerHint = buildTriggerHint(triggers)

      let systemWithContext = SYSTEM_PROMPT + '\n\n' + context + triggerHint

      // Add conversation history summary to give context awareness
      const conversationSummary = createConversationSummary(messages, 7)
      if (conversationSummary) {
        systemWithContext += '\n\n' + conversationSummary
      }

      // Add check-in questions hint for briefings
      if (isBriefing) {
        const checkInQs = generateCheckInQuestions(context)
        if (checkInQs.length > 0) {
          const qsText = checkInQs.map(q => `- ${q.text}`).join('\n')
          systemWithContext += `\n\n[CHECK-IN QUESTIONS TO ASK]: Answer and address these proactively in your briefing:\n${qsText}`
        }
      }

      const trimmed = newMessages.slice(-MAX_HISTORY).map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 3000,
          messages: [{ role: 'system', content: systemWithContext }, ...trimmed],
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'API error')
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      const assistantMsg = { role: 'assistant', content, ts: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
      await saveMessage('assistant', content)

      // Save extracted actions as suggestions for the Suggestions module
      const { actions } = parseActions(content)
      if (actions.length > 0) {
        saveActionsAsSuggestions(actions).catch(() => {})
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}. Please check your API key in Settings.`, ts: new Date().toISOString() }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col" style={{ height: '100%', maxHeight: 'calc(100svh - 0px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between shrink-0"
        style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', backdropFilter: 'blur(16px)' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Kingdom OS Assistant</h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Powered by Groq · KSM Co-Pilot</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} disabled={clearing}
            style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            {clearing ? 'Clearing…' : 'Clear'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ display: 'flex', flexDirection: 'column', gap: 16, overscrollBehavior: 'contain', padding: '12px 12px', maxWidth: '100%' }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-dim), rgba(96,165,250,0.1))', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Zap size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Your ministry co-pilot is ready.</p>
            {!apiKey ? (
              <p style={{ fontSize: 12, color: 'var(--accent-amber)' }}>Add your Groq API key in Settings to begin.</p>
            ) : (
              <p style={{ fontSize: 12 }}>Ask anything about KSM — I'll suggest actions you can approve.</p>
            )}
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} timestamp={msg.ts} />)}
        {loading && (
          <div className="flex gap-3">
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={13} color="#fff" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', backdropFilter: 'blur(12px)' }}>
              <Loader2 size={16} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="shrink-0 px-4 py-3 mb-16 md:mb-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', backdropFilter: 'blur(16px)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
            placeholder="Ask anything about KSM…"
            rows={1}
            className="ksm-input"
            style={{ resize: 'none', maxHeight: 128, borderRadius: 14 }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px' }}
          />
          <button type="submit" disabled={!input.trim() || loading} className="btn-primary" style={{ padding: '10px 12px', borderRadius: 12, flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Enter to send · Shift+Enter for new line</p>
      </form>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
