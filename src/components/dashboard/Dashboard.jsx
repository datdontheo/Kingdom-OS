import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDailyScripture } from '../../lib/scriptures'
import { formatDate, isOverdue, inNext7Days, daysSince, today } from '../../lib/utils'
import { CalendarDays, Users, CheckSquare, Target, Bell, MessageCircle, X, ExternalLink } from 'lucide-react'

function StatCard({ label, value, color, to }) {
  const content = (
    <div className="stat-card flex flex-col gap-1" style={{ borderColor: color + '30' }}>
      <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function SectionHeader({ icon: Icon, title, to, color = 'var(--accent)' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
        <Icon size={14} style={{ color }} />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {to && (
        <Link to={to} style={{ fontSize: 12, color: 'var(--accent)' }}
          className="hover:underline">View all</Link>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>{text}</p>
}

function ReminderItem({ reminder, onDismiss }) {
  return (
    <div className="flex items-start gap-3">
      <Bell size={14} style={{ color: 'var(--accent-amber)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{reminder.title}</p>
        {reminder.body && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{reminder.body}</p>}
        <div className="flex items-center gap-3 mt-1">
          <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>{formatDate(reminder.due_at?.split('T')[0])}</span>
          {reminder.whatsapp_message && reminder.whatsapp_number && (
            <a
              href={`https://wa.me/${reminder.whatsapp_number.replace(/\D/g,'')}?text=${encodeURIComponent(reminder.whatsapp_message)}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1"
              style={{ fontSize: 11, color: 'var(--accent-green)' }}
            >
              <ExternalLink size={10} /> WhatsApp
            </a>
          )}
        </div>
      </div>
      <button onClick={() => onDismiss(reminder.id)} style={{ color: 'var(--text-muted)', flexShrink: 0, padding: 2 }}>
        <X size={14} />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const scripture = getDailyScripture()
  const [people, setPeople] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Theo')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 5) return 'Still burning, still faithful'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  async function load() {
    const [{ data: s }, { data: p }, { data: t }, { data: e }, { data: m }, { data: r }] = await Promise.all([
      supabase.from('settings').select('user_name').limit(1).single(),
      supabase.from('people').select('*').neq('follow_up_status', 'No action needed').order('last_contact_date', { ascending: true }),
      supabase.from('tasks').select('*').neq('status', 'Done').order('due_date', { ascending: true }),
      supabase.from('teaching_calendar').select('*').gte('date', today()).order('date').limit(10),
      supabase.from('project_milestones').select('*, vision_projects(name, owner)').eq('completed', false).order('due_date'),
      supabase.from('reminders').select('*').eq('status', 'pending').order('due_at'),
    ])
    if (s?.user_name) setUserName(s.user_name)
    setPeople(p || [])
    setTasks(t || [])
    setEvents(e || [])
    setMilestones(m || [])
    setReminders(r || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function dismissReminder(id) {
    await supabase.from('reminders').update({ status: 'dismissed' }).eq('id', id)
    setReminders(r => r.filter(x => x.id !== id))
  }

  const overdueFollowUps = people.filter(p =>
    p.follow_up_due_date ? isOverdue(p.follow_up_due_date) :
    p.last_contact_date ? daysSince(p.last_contact_date) > 14 : false
  )
  const upcomingEvents = events.filter(e => inNext7Days(e.date))
  const overdueTasks = tasks.filter(t => t.due_date && isOverdue(t.due_date))
  const overdueMilestones = milestones.filter(m => m.due_date && isOverdue(m.due_date))
  const dueReminders = reminders.filter(r => new Date(r.due_at) <= new Date())

  const todayStr = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 40px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{todayStr}</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
          {greeting()}, {userName}.
        </h1>
      </div>

      {/* Stats row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <StatCard label="Follow-ups due" value={overdueFollowUps.length} color="var(--accent-amber)" to="/people" />
          <StatCard label="Overdue tasks" value={overdueTasks.length} color="var(--accent-red)" to="/tasks" />
          <StatCard label="Events this week" value={upcomingEvents.length} color="var(--accent-blue)" to="/teaching" />
          <StatCard label="Late milestones" value={overdueMilestones.length} color="var(--accent)" to="/projects" />
        </div>
      )}

      {/* Due reminders */}
      {dueReminders.length > 0 && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: 16, borderColor: 'var(--accent-amber)', borderLeftWidth: 3 }}>
          <SectionHeader icon={Bell} title="Due Now" color="var(--accent-amber)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dueReminders.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismissReminder} />)}
          </div>
        </div>
      )}

      {/* Scripture */}
      <div className="glass-card glass-glow" style={{ padding: '18px', marginBottom: 16, background: 'linear-gradient(135deg, var(--accent-dim), rgba(96,165,250,0.06))' }}>
        <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Word</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{scripture.text}"</p>
        <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 10, fontWeight: 500 }}>— {scripture.ref} (NKJV)</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Upcoming events */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <SectionHeader icon={CalendarDays} title="This Week" to="/teaching" color="var(--accent-blue)" />
            {upcomingEvents.length === 0 ? <EmptyState text="No events in the next 7 days" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingEvents.map(e => (
                  <div key={e.id} className="flex items-start gap-3">
                    <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, width: 72, flexShrink: 0, paddingTop: 2 }}>{formatDate(e.date)}</span>
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{e.event_name}</p>
                      {e.venue && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.venue}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up due */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <SectionHeader icon={Users} title="Follow-up Due" to="/people" color="var(--accent-amber)" />
            {overdueFollowUps.length === 0 ? <EmptyState text="No follow-ups overdue" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overdueFollowUps.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.role}</p>
                    </div>
                    <span className="badge" style={{ color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', background: 'rgba(251,191,36,0.08)', fontSize: 11 }}>
                      {p.last_contact_date ? `${daysSince(p.last_contact_date)}d ago` : 'No contact'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue tasks */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <SectionHeader icon={CheckSquare} title="Overdue Tasks" to="/tasks" color="var(--accent-red)" />
            {overdueTasks.length === 0 ? <EmptyState text="No overdue tasks" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdueTasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: t.priority === 'High' ? 'var(--accent-red)' : t.priority === 'Medium' ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: 'var(--text-primary)' }} className="truncate">{t.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.category} · Due {formatDate(t.due_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue milestones */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <SectionHeader icon={Target} title="Overdue Milestones" to="/projects" color="var(--accent)" />
            {overdueMilestones.length === 0 ? <EmptyState text="No overdue milestones" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overdueMilestones.slice(0, 5).map(m => (
                  <div key={m.id}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{m.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.vision_projects?.name} · {m.vision_projects?.owner}</p>
                    <p style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 2 }}>{formatDate(m.due_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active pipeline */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <SectionHeader icon={CheckSquare} title="In Progress" to="/tasks" color="var(--accent-blue)" />
            {tasks.filter(t => t.status === 'In progress').length === 0 ? <EmptyState text="No tasks in progress" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.filter(t => t.status === 'In progress').slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="badge" style={{ color: 'var(--accent-blue)', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.08)', flexShrink: 0 }}>
                      {t.category}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }} className="truncate flex-1">{t.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
