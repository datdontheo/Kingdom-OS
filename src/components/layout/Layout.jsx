import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, CheckSquare,
  BookOpen, Target, FileText, Settings, Sun, Moon, Menu, Bell,
  UserCircle, Lightbulb
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useReminders } from '../../hooks/useReminders'

const FONT = 'Nexa, DM Sans, sans-serif'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/meetings', icon: FileText, label: 'Meetings' },
  { to: '/teachings', icon: BookOpen, label: 'Teachings' },
  { to: '/leaders', icon: Users, label: 'Leaders' },
  { to: '/members', icon: UserCircle, label: 'Members' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
  { to: '/assistant', icon: MessageSquare, label: 'Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} end={to === '/'} style={{ textDecoration: 'none' }} onClick={onClick}>
      {({ isActive }) => (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 12px', borderRadius: 10,
          background: isActive ? 'rgba(184,155,56,0.11)' : 'transparent',
          color: isActive ? 'var(--accent)' : '#3d3d4e',
          cursor: 'pointer', transition: 'background 0.15s',
        }}>
          <Icon size={18} strokeWidth={isActive ? 2 : 1.75} style={{ flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontWeight: isActive ? 700 : 500, fontSize: 15 }}>{label}</span>
        </div>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClose, theme, toggle }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: '4px 4px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #b89b38, #d4a817)', color: '#fff', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            K
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1, fontFamily: FONT }}>Kingdom Seekers</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: FONT, fontWeight: 500 }}>Ministry Platform</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(n => <NavItem key={n.to} {...n} onClick={onClose} />)}
      </div>

      {/* Bottom */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#b89b38', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            T
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: FONT }}>Theophilus Laryea</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: FONT }}>System Admin</p>
          </div>
        </div>
        <button
          onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, color: '#3d3d4e', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', fontSize: 15, fontWeight: 500, fontFamily: FONT, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </>
  )
}

export default function Layout({ children }) {
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  useReminders()

  return (
    <div style={{ display: 'flex', height: '100svh', overflow: 'hidden', background: 'var(--bg-base)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0" style={{ width: 'var(--nav-width)', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '24px 14px', zIndex: 10 }}>
        <SidebarContent onClose={() => {}} theme={theme} toggle={toggle} />
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', background: 'rgba(0,0,0,0.45)' }} onClick={() => setMobileOpen(false)}>
          <aside style={{ width: 280, height: '100%', background: 'var(--bg-surface)', padding: '24px 16px', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 32px rgba(0,0,0,0.18)', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <SidebarContent onClose={() => setMobileOpen(false)} theme={theme} toggle={toggle} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <Menu size={22} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: FONT }}>Kingdom Seekers</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/assistant')} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <MessageSquare size={20} />
            </button>
            <button onClick={() => navigate('/reminders')} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <Bell size={20} />
            </button>
          </div>
        </div>

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
