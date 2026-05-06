import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { today, isOverdue, daysSince, inNext7Days } from '../../lib/utils'
import { Send, Loader2, Bot } from 'lucide-react'

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

TONE: Warm, direct, and practically helpful — like a trusted co-labourer who knows the weight of the call. Never make Theo feel behind or overwhelmed. Speak plainly. Anchor suggestions in Scripture naturally. Always bring things back to the vision: disciples made, Kingdom advancing, leaders growing. When in doubt ask a clarifying question rather than assuming.`

async function fetchMinistryContext() {
  const todayStr = today()
  const [
    { data: people },
    { data: tasks },
    { data: events },
    { data: milestones },
    { data: projects },
  ] = await Promise.all([
    supabase.from('people').select('name, role, last_contact_date, follow_up_status, follow_up_due_date').neq('follow_up_status', 'No action needed'),
    supabase.from('tasks').select('title, category, priority, status, due_date, assigned_to').neq('status', 'Done'),
    supabase.from('teaching_calendar').select('event_name, date, venue, topic, preparation_status').gte('date', todayStr).order('date').limit(10),
    supabase.from('project_milestones').select('title, due_date, completed, vision_projects(name, owner)').eq('completed', false).order('due_date').limit(20),
    supabase.from('vision_projects').select('name, status, owner, target_date').neq('status', 'Complete'),
  ])

  const overdueFollowUps = (people || []).filter(p =>
    p.follow_up_due_date ? isOverdue(p.follow_up_due_date) :
    p.last_contact_date ? daysSince(p.last_contact_date) > 14 : false
  )
  const overdueTasks = (tasks || []).filter(t => t.due_date && isOverdue(t.due_date))
  const upcomingEvents = (events || []).filter(e => inNext7Days(e.date))
  const overdueMilestones = (milestones || []).filter(m => m.due_date && isOverdue(m.due_date))

  return `
<ministry_context date="${todayStr}">
  <people_overdue_for_followup count="${overdueFollowUps.length}">
    ${overdueFollowUps.map(p => `<person name="${p.name}" role="${p.role}" last_contact="${p.last_contact_date || 'unknown'}" days_since="${p.last_contact_date ? daysSince(p.last_contact_date) : 'unknown'}" />`).join('\n    ')}
  </people_overdue_for_followup>
  <upcoming_events_7_days count="${upcomingEvents.length}">
    ${upcomingEvents.map(e => `<event name="${e.event_name}" date="${e.date}" venue="${e.venue || ''}" topic="${e.topic || ''}" prep="${e.preparation_status}" />`).join('\n    ')}
  </upcoming_events_7_days>
  <overdue_tasks count="${overdueTasks.length}">
    ${overdueTasks.map(t => `<task title="${t.title}" category="${t.category}" priority="${t.priority}" due="${t.due_date}" assigned_to="${t.assigned_to || 'unassigned'}" />`).join('\n    ')}
  </overdue_tasks>
  <overdue_milestones count="${overdueMilestones.length}">
    ${overdueMilestones.map(m => `<milestone title="${m.title}" due="${m.due_date}" project="${m.vision_projects?.name || ''}" owner="${m.vision_projects?.owner || ''}" />`).join('\n    ')}
  </overdue_milestones>
  <active_projects count="${(projects || []).length}">
    ${(projects || []).map(p => `<project name="${p.name}" status="${p.status}" owner="${p.owner || ''}" target="${p.target_date || ''}" />`).join('\n    ')}
  </active_projects>
</ministry_context>`
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center shrink-0 mt-1">
          <Bot size={14} className="text-violet-300" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-violet-900/60 border border-violet-700/40 text-gray-100 rounded-tr-sm'
          : 'bg-gray-800/80 border border-gray-700/40 text-gray-200 rounded-tl-sm'
      }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  )
}

export default function Assistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [briefingSent, setBriefingSent] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    supabase.from('settings').select('claude_api_key').limit(1).single()
      .then(({ data }) => {
        if (data?.claude_api_key) setApiKey(data.claude_api_key)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (apiKey && !briefingSent && messages.length === 0) {
      const lastBriefingDate = sessionStorage.getItem('ksm_briefing_date')
      const todayStr = today()
      if (lastBriefingDate !== todayStr) {
        sendMessage(null, true)
        sessionStorage.setItem('ksm_briefing_date', todayStr)
        setBriefingSent(true)
      }
    }
  }, [apiKey])

  async function sendMessage(e, isBriefing = false) {
    if (e) e.preventDefault()
    const userText = isBriefing
      ? 'Give me my Kingdom OS morning briefing for today.'
      : input.trim()
    if (!userText || loading) return
    if (!apiKey) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Please add your DeepSeek API key in Settings to use the assistant.'
      }])
      return
    }

    const userMsg = { role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const context = await fetchMinistryContext()
      const systemWithContext = SYSTEM_PROMPT + '\n\n' + context

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemWithContext },
            ...newMessages,
          ],
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'API error')
      }

      const data = await response.json()
      const assistantMsg = { role: 'assistant', content: data.choices[0].message.content }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}. Please check your API key in Settings.`
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100svh-0px)] md:max-h-svh">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/60 bg-gray-900/30 shrink-0">
        <h2 className="text-base font-semibold text-white">Kingdom OS Assistant</h2>
        <p className="text-xs text-gray-500">Powered by DeepSeek · KSM Ministry Co-Pilot</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Bot size={32} className="mx-auto mb-3 text-violet-700" />
            <p className="text-sm">Your ministry co-pilot is ready.</p>
            {!apiKey && (
              <p className="text-xs mt-2 text-amber-500">Add your DeepSeek API key in Settings to begin.</p>
            )}
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-violet-900/60 border border-violet-700/40 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-violet-300" />
            </div>
            <div className="bg-gray-800/80 border border-gray-700/40 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={16} className="text-violet-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-800/60 bg-gray-900/30 shrink-0 mb-16 md:mb-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Ask anything about KSM…"
            rows={1}
            className="flex-1 bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-violet-600/60 max-h-32"
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1.5">Enter to send · Shift+Enter for new line</p>
      </form>
    </div>
  )
}
