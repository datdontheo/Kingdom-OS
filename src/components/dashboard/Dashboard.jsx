import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDailyScripture } from '../../lib/scriptures'
import { formatDate, isOverdue, inNext7Days, daysSince, today } from '../../lib/utils'
import { Users, CheckSquare, Target, Settings, TrendingUp, MessageCircle, X, ExternalLink, Plus } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, to, sub }) {
  const content = (
    <div className="glass-card flex flex-col gap-2" style={{ padding: '20px 20px 16px', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, fontFamily: 'Nexa, sans-serif' }}>{label}</span>
          <p style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: 6, fontFamily: 'Nexa, sans-serif' }}>{value}</p>
        </div>
        {Icon && (
          <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '18' }}>
            <Icon size={22} style={{ color }} strokeWidth={2} />
          </div>
        )}
      </div>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Nexa, sans-serif', marginTop: 2 }}>{sub}</p>}
    </div>
  )
  return content
}

function QuickActionButton({ icon: Icon, label, to }) {
  return (
    <Link to={to} className="glass-card flex items-center gap-3 p-4 hover:bg-[var(--bg-card-hover)]" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-dim)' }}>
        <Icon size={18} style={{ color: 'var(--accent)' }} strokeWidth={2} />
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Nexa, sans-serif' }}>{label}</span>
      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
    </Link>
  )
}

function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, sans-serif' }}>{title}</h2>
      {to && (
        <Link to={to} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }} className="hover:underline">
          View All →
        </Link>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0', textAlign: 'center', fontFamily: 'Nexa, sans-serif' }}>{text}</p>
}

function HierarchyItem({ region, items }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="glass-card p-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--bg-card-hover)]"
        style={{ textAlign: 'left', color: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>
            {region[0]}
          </div>
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Nexa, sans-serif' }}>{region}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{items} mega pods · Leader: Unassigned</p>
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
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
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('User')

  async function load() {
    const [{ data: s }, { data: p }, { data: t }, { data: e }, { data: m }] = await Promise.all([
      supabase.from('settings').select('user_name').limit(1).single().catch(() => ({ data: null })),
      supabase.from('people').select('*').limit(5),
      supabase.from('tasks').select('*').limit(5),
      supabase.from('teaching_calendar').select('*').gte('date', today()).limit(5),
      supabase.from('project_milestones').select('*').limit(5),
    ]).catch(() => [{ data: null }, { data: [] }, { data: [] }, { data: [] }, { data: [] }])
    
    if (s?.user_name) setUserName(s.user_name)
    setPeople(p || [])
    setTasks(t || [])
    setEvents(e || [])
    setMilestones(m || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalMembers = people.length
  const activePods = 1
  const avgAttendance = 27

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Page Title */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, sans-serif' }}>Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Members" value={totalMembers} icon={Users} color="#c4920a" to="/people" sub={`${totalMembers} active`} />
        <StatCard label="Active Pods" value={activePods} icon={MessageCircle} color="#22a355" to="/projects" sub="Across 1 regions" />
        <StatCard label="Avg. Attendance" value={avgAttendance + '%'} icon={CheckSquare} color="#8b5cf6" to="/teaching" sub="Last 4 weeks" />
        <StatCard label="Pending Tasks" value={tasks.length} icon={Target} color="#ffa726" to="/tasks" sub="Action needed" />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, marginBottom: 32 }}>

        {/* Left Column - Ministry Hierarchy */}
        <div className="glass-card" style={{ padding: 24 }}>
          <SectionHeader title="Ministry Hierarchy" />
          {loading ? (
            <EmptyState text="Loading..." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <HierarchyItem region="Cape Coast" items="1" />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Nexa, sans-serif' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickActionButton icon={Plus} label="Add New Member" to="/people" />
              <QuickActionButton icon={Users} label="Pending Follow-ups" to="/people" />
              <QuickActionButton icon={CheckSquare} label="Upcoming Meetings" to="/meetings" />
            </div>
          </div>

          {/* Recent Reports */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Nexa, sans-serif' }}>Recent Reports</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Nexa, sans-serif' }}>No reports yet.</p>
          </div>

        </div>
      </div>

      {/* Devotion Section */}
      <div style={{ marginTop: 32, borderRadius: 12, overflow: 'hidden', background: '#7a5c08' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, color: 'white' }}>
          <div className="flex items-center gap-3">
            <Settings size={20} strokeWidth={2} />
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Nexa, sans-serif' }}>Today's Devotion</h2>
          </div>
          <Link to="#" style={{ fontSize: 12, color: 'white', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }} className="hover:underline">
            View All →
          </Link>
        </div>
        <div style={{ padding: 24, background: 'var(--bg-card)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Nexa, sans-serif' }}>{scripture.text.substring(0, 30)}...</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'Nexa, sans-serif' }}>{scripture.ref}</p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, fontFamily: 'Nexa, sans-serif' }}>Read today's scripture and devotional message to start your day with spiritual guidance.</p>
        </div>
      </div>

    </div>
  )
}
