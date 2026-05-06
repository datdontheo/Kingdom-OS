import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDailyScripture } from '../../lib/scriptures'
import { today, isOverdue, daysSince, inNext7Days, formatDate } from '../../lib/utils'
import { Users, Calendar, Target, AlertCircle, BookOpen, ChevronRight } from 'lucide-react'

function Section({ icon: Icon, title, color, children, to }) {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color }} strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, DM Sans, sans-serif' }}>{title}</h3>
        </div>
        {to && (
          <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            View all <ChevronRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyRow({ text }) {
  return <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '4px 0', fontFamily: 'Nexa, DM Sans, sans-serif' }}>{text}</p>
}

function Row({ primary, secondary, badge, badgeColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Nexa, DM Sans, sans-serif' }}>{primary}</p>
        {secondary && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'Nexa, DM Sans, sans-serif' }}>{secondary}</p>}
      </div>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor || 'var(--accent)', background: (badgeColor || 'var(--accent)') + '15', padding: '3px 8px', borderRadius: 6, flexShrink: 0, marginLeft: 8 }}>
          {badge}
        </span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const scripture = getDailyScripture()
  const [followUps, setFollowUps] = useState([])
  const [events, setEvents] = useState([])
  const [meetings, setMeetings] = useState([])
  const [projects, setProjects] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const todayStr = today()
      const [
        { data: people },
        { data: evts },
        { data: mtgs },
        { data: projs },
        { data: miles },
      ] = await Promise.all([
        supabase.from('people').select('name, role, last_contact_date, follow_up_due_date, follow_up_status').neq('follow_up_status', 'No action needed'),
        supabase.from('teaching_calendar').select('event_name, date, venue, topic, preparation_status').gte('date', todayStr).order('date').limit(10),
        supabase.from('meeting_notes').select('meeting_type, date, notes').gte('date', todayStr).order('date').limit(10),
        supabase.from('vision_projects').select('name, status, owner, target_date').in('status', ['Planning', 'Active']),
        supabase.from('project_milestones').select('title, due_date, vision_projects(name)').eq('completed', false).lt('due_date', todayStr).order('due_date').limit(10),
      ]).catch(() => [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }])

      setFollowUps((people || []).filter(p =>
        p.follow_up_due_date ? isOverdue(p.follow_up_due_date) :
        p.last_contact_date ? daysSince(p.last_contact_date) > 14 : false
      ))
      setEvents((evts || []).filter(e => inNext7Days(e.date)))
      setMeetings((mtgs || []).filter(m => inNext7Days(m.date)))
      setProjects(projs || [])
      setMilestones(miles || [])
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const upcomingItems = [
    ...events.map(e => ({ label: e.event_name, sub: `${formatDate(e.date)}${e.venue ? ' · ' + e.venue : ''}`, type: 'Teaching' })),
    ...meetings.map(m => ({ label: m.meeting_type, sub: formatDate(m.date), type: 'Meeting' })),
  ].sort((a, b) => a.sub.localeCompare(b.sub))

  return (
    <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, DM Sans, sans-serif' }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'Nexa, DM Sans, sans-serif' }}>{greeting}, Theo · {dateLabel}</p>
      </div>

      {/* Daily Scripture */}
      <div className="glass-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(184,155,56,0.07) 0%, rgba(184,155,56,0.02) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} strokeWidth={2} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Nexa, DM Sans, sans-serif' }}>Daily Verse</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.65, fontFamily: 'Nexa, DM Sans, sans-serif', fontStyle: 'italic' }}>"{scripture.text}"</p>
        <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginTop: 10, fontFamily: 'Nexa, DM Sans, sans-serif' }}>{scripture.ref}</p>
      </div>

      {/* Upcoming events & meetings */}
      <Section icon={Calendar} title="Upcoming — Next 7 Days" color="#5a9fd4" to="/teaching">
        {loading ? <EmptyRow text="Loading…" /> :
          upcomingItems.length === 0 ? <EmptyRow text="Nothing scheduled in the next 7 days." /> :
          upcomingItems.map((item, i) => (
            <Row key={i} primary={item.label} secondary={item.sub}
              badge={item.type}
              badgeColor={item.type === 'Teaching' ? '#8b5cf6' : '#5a9fd4'} />
          ))
        }
      </Section>

      {/* People due for follow-up */}
      <Section icon={Users} title="Follow-ups Due" color="#c4920a" to="/people">
        {loading ? <EmptyRow text="Loading…" /> :
          followUps.length === 0 ? <EmptyRow text="No overdue follow-ups. You're on top of it!" /> :
          followUps.slice(0, 5).map((p, i) => (
            <Row key={i}
              primary={p.name}
              secondary={p.role + (p.last_contact_date ? ` · Last contact ${daysSince(p.last_contact_date)}d ago` : '')}
              badge={p.follow_up_status}
              badgeColor="#c4920a"
            />
          ))
        }
        {followUps.length > 5 && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'Nexa, DM Sans, sans-serif' }}>+{followUps.length - 5} more</p>}
      </Section>

      {/* Active pipeline */}
      <Section icon={Target} title="Active Pipeline" color="#22a355" to="/projects">
        {loading ? <EmptyRow text="Loading…" /> :
          projects.length === 0 ? <EmptyRow text="No active projects." /> :
          projects.map((p, i) => (
            <Row key={i}
              primary={p.name}
              secondary={p.owner ? `Owner: ${p.owner}` : undefined}
              badge={p.status}
              badgeColor={p.status === 'Active' ? '#22a355' : '#ffa726'}
            />
          ))
        }
      </Section>

      {/* Overdue milestones */}
      {!loading && milestones.length > 0 && (
        <Section icon={AlertCircle} title="Overdue Milestones" color="#ef5350" to="/projects">
          {milestones.map((m, i) => (
            <Row key={i}
              primary={m.title}
              secondary={`${m.vision_projects?.name || 'Project'} · Due ${formatDate(m.due_date)}`}
              badge="Overdue"
              badgeColor="#ef5350"
            />
          ))}
        </Section>
      )}

    </div>
  )
}
