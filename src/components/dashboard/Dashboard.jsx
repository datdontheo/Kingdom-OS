import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDailyScripture } from '../../lib/scriptures'
import { formatDate, isOverdue, inNext7Days, daysSince, today } from '../../lib/utils'
import { CalendarDays, Users, CheckSquare, Target, Clock } from 'lucide-react'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, to }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
        <Icon size={15} className="text-violet-400" />
        {title}
      </div>
      {to && <Link to={to} className="text-xs text-violet-400 hover:text-violet-300">View all</Link>}
    </div>
  )
}

function EmptyState({ text }) {
  return <p className="text-gray-500 text-sm py-2">{text}</p>
}

export default function Dashboard() {
  const scripture = getDailyScripture()
  const [people, setPeople] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Theo')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 5) return 'Still burning, still faithful'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: p }, { data: t }, { data: e }, { data: m }] = await Promise.all([
        supabase.from('settings').select('user_name').limit(1).single(),
        supabase.from('people').select('*').neq('follow_up_status', 'No action needed').order('last_contact_date', { ascending: true }),
        supabase.from('tasks').select('*').neq('status', 'Done').order('due_date', { ascending: true }),
        supabase.from('teaching_calendar').select('*').gte('date', today()).order('date').limit(10),
        supabase.from('project_milestones').select('*, vision_projects(name, owner)').eq('completed', false).order('due_date'),
      ])
      if (s?.user_name) setUserName(s.user_name)
      setPeople(p || [])
      setTasks(t || [])
      setEvents(e || [])
      setMilestones(m || [])
      setLoading(false)
    }
    load()
  }, [])

  const overdueFollowUps = people.filter(p =>
    p.follow_up_due_date ? isOverdue(p.follow_up_due_date) :
    p.last_contact_date ? daysSince(p.last_contact_date) > 14 : false
  )
  const upcomingEvents = events.filter(e => inNext7Days(e.date))
  const overdueTasks = tasks.filter(t => t.due_date && isOverdue(t.due_date))
  const overdueMilestones = milestones.filter(m => m.due_date && isOverdue(m.due_date))

  const todayStr = new Date().toLocaleDateString('en-GH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10 space-y-5">
      {/* Header */}
      <div>
        <p className="text-gray-500 text-sm">{todayStr}</p>
        <h2 className="text-xl font-semibold text-white mt-1">{greeting()}, {userName}.</h2>
      </div>

      {/* Scripture */}
      <Card className="border-violet-800/30 bg-violet-950/20">
        <p className="text-xs text-violet-400 font-medium mb-1.5">Today's Word</p>
        <p className="text-gray-200 text-sm leading-relaxed italic">"{scripture.text}"</p>
        <p className="text-violet-400 text-xs mt-2">— {scripture.ref} (NKJV)</p>
      </Card>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Upcoming events */}
          <Card>
            <SectionHeader icon={CalendarDays} title="This Week" to="/teaching" />
            {upcomingEvents.length === 0 ? (
              <EmptyState text="No events in the next 7 days" />
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map(e => (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="text-violet-400 text-xs font-medium pt-0.5 w-20 shrink-0">{formatDate(e.date)}</span>
                    <div>
                      <p className="text-sm text-gray-200">{e.event_name}</p>
                      {e.venue && <p className="text-xs text-gray-500">{e.venue}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Follow-up due */}
          <Card>
            <SectionHeader icon={Users} title="Follow-up Due" to="/people" />
            {overdueFollowUps.length === 0 ? (
              <EmptyState text="No follow-ups overdue" />
            ) : (
              <ul className="space-y-2">
                {overdueFollowUps.slice(0, 5).map(p => (
                  <li key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-200">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.role}</p>
                    </div>
                    <span className="text-xs text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full">
                      {p.last_contact_date ? `${daysSince(p.last_contact_date)}d ago` : 'No contact'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Overdue tasks */}
          <Card>
            <SectionHeader icon={CheckSquare} title="Overdue Tasks" to="/tasks" />
            {overdueTasks.length === 0 ? (
              <EmptyState text="No overdue tasks" />
            ) : (
              <ul className="space-y-2">
                {overdueTasks.slice(0, 5).map(t => (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      t.priority === 'High' ? 'bg-red-400' : t.priority === 'Medium' ? 'bg-amber-400' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.category} · Due {formatDate(t.due_date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Overdue milestones */}
          <Card>
            <SectionHeader icon={Target} title="Overdue Milestones" to="/projects" />
            {overdueMilestones.length === 0 ? (
              <EmptyState text="No overdue milestones" />
            ) : (
              <ul className="space-y-2">
                {overdueMilestones.slice(0, 5).map(m => (
                  <li key={m.id} className="flex items-start gap-3">
                    <Clock size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-200">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.vision_projects?.name} · {m.vision_projects?.owner}</p>
                      <p className="text-xs text-red-400">{formatDate(m.due_date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Active tasks pipeline */}
          <Card>
            <SectionHeader icon={CheckSquare} title="Active Pipeline" to="/tasks" />
            {tasks.filter(t => t.status === 'In progress').length === 0 ? (
              <EmptyState text="No tasks in progress" />
            ) : (
              <ul className="space-y-2">
                {tasks.filter(t => t.status === 'In progress').slice(0, 5).map(t => (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className="text-xs bg-blue-950/60 text-blue-300 border border-blue-800/40 px-2 py-0.5 rounded-full">{t.category}</span>
                    <p className="text-sm text-gray-200 truncate flex-1">{t.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
