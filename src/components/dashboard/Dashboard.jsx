import { Link } from 'react-router-dom'
import { getDailyScripture } from '../../lib/scriptures'
import { Users, Target, FileText, CheckSquare, MessageSquare, Plus, BookOpen } from 'lucide-react'

export default function Dashboard() {
  const scripture = getDailyScripture()

  const shortcuts = [
    { icon: Users, label: 'Manage People', to: '/people', color: '#c4920a' },
    { icon: Target, label: 'Projects', to: '/projects', color: '#22a355' },
    { icon: BookOpen, label: 'Teaching', to: '/teaching', color: '#8b5cf6' },
    { icon: CheckSquare, label: 'Tasks', to: '/tasks', color: '#ffa726' },
    { icon: FileText, label: 'Meetings', to: '/meetings', color: '#5a9fd4' },
    { icon: MessageSquare, label: 'AI Assistant', to: '/assistant', color: '#d97706' },
  ]

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Page Title */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, sans-serif' }}>Dashboard</h1>
      </div>

      {/* Daily Scripture */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 40, background: 'linear-gradient(135deg, rgba(184,155,56,0.06) 0%, rgba(184,155,56,0.02) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 24 }}>✨</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Nexa, sans-serif' }}>Daily Verse</h2>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12, fontFamily: 'Nexa, sans-serif' }}>{scripture.text}</p>
        <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, fontFamily: 'Nexa, sans-serif' }}>{scripture.ref}</p>
      </div>

      {/* Quick Shortcuts Grid */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, fontFamily: 'Nexa, sans-serif' }}>Quick Shortcuts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              className="glass-card"
              style={{
                padding: 24,
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: shortcut.color + '18' }}>
                <shortcut.icon size={24} style={{ color: shortcut.color }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Nexa, sans-serif' }}>{shortcut.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
