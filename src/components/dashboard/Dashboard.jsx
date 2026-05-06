import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDailyScripture } from '../../lib/scriptures'
import { today, tomorrow, formatDate, formatDateTime, daysSince, prepStatusColor, memberIssueColor, leaderStatusColor } from '../../lib/utils'
import {
  Users, CheckSquare, AlertCircle, BookOpen, ChevronRight,
  Bell, Target, Lightbulb, FileText, UserCircle
} from 'lucide-react'

const FONT = 'Nexa, DM Sans, sans-serif'

function Section({ icon: Icon, title, color, children, to }) {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color }} strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>{title}</h3>
        </div>
        {to && (
          <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, fontFamily: FONT }}>
            View all <ChevronRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }) {
  return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', fontFamily: FONT }}>{text}</p>
}

function Row({ primary, secondary, badge, badgeColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: FONT }}>{primary}</p>
        {secondary && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT }}>{secondary}</p>}
      </div>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor || 'var(--accent)', background: (badgeColor || 'var(--accent)') + '18', padding: '3px 8px', borderRadius: 6, flexShrink: 0, marginLeft: 8, fontFamily: FONT }}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const scripture = getDailyScripture()
  const [tasks, setTasks] = useState([])
  const [meetings, setMeetings] = useState([])
  const [teachings, setTeachings] = useState([])
  const [leaders, setLeaders] = useState([])
  const [urgentMembers, setUrgentMembers] = useState([])
  const [reminders, setReminders] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const todayStr = today()
      const tomorrowStr = tomorrow()
      const next7 = new Date()
      next7.setDate(next7.getDate() + 7)
      const next7Str = next7.toISOString().split('T')[0]

      const results = await Promise.allSettled([
        supabase.from('tasks').select('id, title, category, priority, due_date, status')
          .neq('status', 'Done').lte('due_date', todayStr).order('due_date').limit(5),
        supabase.from('meeting_notes').select('id, meeting_type, date, notes')
          .gte('date', todayStr).lte('date', next7Str).order('date').limit(3),
        supabase.from('teaching_calendar').select('id, event_name, date, venue, preparation_status')
          .gte('date', todayStr).lte('date', next7Str).order('date').limit(3),
        supabase.from('leaders').select('id, name, role, last_contact_date, follow_up_due_date, follow_up_status')
          .neq('follow_up_status', 'No action needed').order('created_at').limit(5),
        supabase.from('people').select('id, name, issue_status, last_contact_date')
          .in('issue_status', ['Needs call', 'Escalated']).limit(3),
        supabase.from('reminders').select('id, title, body, due_at, done')
          .eq('done', false).lte('due_at', tomorrowStr + 'T23:59:59').order('due_at').limit(5),
        supabase.from('assistant_suggestions').select('id, suggestion_type, title, description')
          .eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
        supabase.from('goals').select('id, title, category, next_action, status')
          .eq('status', 'Active').order('created_at').limit(4),
      ])

      const get = (i) => results[i].status === 'fulfilled' ? (results[i].value.data || []) : []

      setTasks(get(0))
      setMeetings(get(1))
      setTeachings(get(2))
      setLeaders(get(3))
      setUrgentMembers(get(4))
      setReminders(get(5))
      setSuggestions(get(6))
      setGoals(get(7))
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const taskPriorityColor = (p) => p === 'High' ? '#ef5350' : p === 'Medium' ? '#ffa726' : '#9b9189'
  const suggestionTypeColor = (t) => {
    const map = { 'Task': '#5a9fd4', 'Reminder': '#ffa726', 'Meeting': '#8b5cf6', 'WhatsApp Message': '#22a355', 'Goal': '#22a355', 'Teaching Preparation': '#5a9fd4' }
    return map[t] || 'var(--accent)'
  }

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontFamily: FONT }}>{greeting}, Theo · {dateLabel}</p>
      </div>

      {/* Daily Scripture */}
      <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(184,155,56,0.07) 0%, rgba(184,155,56,0.02) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Daily Verse</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.65, fontFamily: FONT, fontStyle: 'italic' }}>"{scripture.text}"</p>
        <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginTop: 10, fontFamily: FONT }}>{scripture.ref}</p>
      </div>

      {/* 1. Today's Tasks */}
      <Section icon={CheckSquare} title="Today's Tasks" color="#5a9fd4" to="/tasks">
        {loading ? <EmptyRow text="Loading…" /> :
          tasks.length === 0 ? <EmptyRow text="No tasks due today. You're all clear!" /> :
          tasks.map((t, i) => (
            <Row key={i}
              primary={t.title}
              secondary={t.category + (t.due_date ? ` · Due ${formatDate(t.due_date)}` : '')}
              badge={t.priority}
              badgeColor={taskPriorityColor(t.priority)}
            />
          ))
        }
      </Section>

      {/* 2. Upcoming Meetings */}
      <Section icon={FileText} title="Upcoming Meetings" color="#8b5cf6" to="/meetings">
        {loading ? <EmptyRow text="Loading…" /> :
          meetings.length === 0 ? <EmptyRow text="No meetings in the next 7 days." /> :
          meetings.map((m, i) => (
            <Row key={i}
              primary={m.meeting_type}
              secondary={formatDate(m.date)}
              badge="Meeting"
              badgeColor="#8b5cf6"
            />
          ))
        }
      </Section>

      {/* 3. Upcoming Teachings */}
      <Section icon={BookOpen} title="Upcoming Teachings" color="#22a355" to="/teachings">
        {loading ? <EmptyRow text="Loading…" /> :
          teachings.length === 0 ? <EmptyRow text="No teachings in the next 7 days." /> :
          teachings.map((t, i) => (
            <Row key={i}
              primary={t.event_name}
              secondary={`${formatDate(t.date)}${t.venue ? ' · ' + t.venue : ''}`}
              badge={t.preparation_status || 'Not started'}
              badgeColor={prepStatusColor(t.preparation_status)}
            />
          ))
        }
      </Section>

      {/* 4. Leader Follow-Ups */}
      <Section icon={Users} title="Leader Follow-Ups" color="#c4920a" to="/leaders">
        {loading ? <EmptyRow text="Loading…" /> :
          leaders.length === 0 ? <EmptyRow text="All leaders are up to date." /> :
          leaders.map((l, i) => (
            <Row key={i}
              primary={l.name}
              secondary={l.role + (l.last_contact_date ? ` · Last contact ${daysSince(l.last_contact_date)}d ago` : ' · Never contacted')}
              badge={l.follow_up_status}
              badgeColor={leaderStatusColor(l.follow_up_status)}
            />
          ))
        }
      </Section>

      {/* 5. Urgent Members (conditional — only when someone needs attention) */}
      {!loading && urgentMembers.length > 0 && (
        <Section icon={UserCircle} title="Members Needing Attention" color="#ef5350" to="/members">
          {urgentMembers.map((m, i) => (
            <Row key={i}
              primary={m.name}
              secondary={m.last_contact_date ? `Last contact ${daysSince(m.last_contact_date)}d ago` : 'No contact recorded'}
              badge={m.issue_status}
              badgeColor={memberIssueColor(m.issue_status)}
            />
          ))}
        </Section>
      )}

      {/* 6. Reminders */}
      <Section icon={Bell} title="Reminders" color="#f97316" to="/reminders">
        {loading ? <EmptyRow text="Loading…" /> :
          reminders.length === 0 ? <EmptyRow text="No reminders due today." /> :
          reminders.map((r, i) => (
            <Row key={i}
              primary={r.title}
              secondary={r.body || formatDateTime(r.due_at)}
              badge="Due"
              badgeColor="#f97316"
            />
          ))
        }
      </Section>

      {/* 7. Assistant Suggestions (conditional) */}
      {!loading && suggestions.length > 0 && (
        <Section icon={Lightbulb} title="Assistant Suggestions" color="#8b5cf6" to="/suggestions">
          {suggestions.map((s, i) => (
            <Row key={i}
              primary={s.title}
              secondary={s.description ? s.description.slice(0, 80) : s.suggestion_type}
              badge={s.suggestion_type}
              badgeColor={suggestionTypeColor(s.suggestion_type)}
            />
          ))}
        </Section>
      )}

      {/* 8. Active Goals */}
      <Section icon={Target} title="Active Goals" color="#22a355" to="/goals">
        {loading ? <EmptyRow text="Loading…" /> :
          goals.length === 0 ? <EmptyRow text="No active goals yet. Add one to stay focused!" /> :
          goals.map((g, i) => (
            <Row key={i}
              primary={g.title}
              secondary={g.next_action || g.category}
              badge={g.category}
              badgeColor="#22a355"
            />
          ))
        }
      </Section>

    </div>
  )
}
