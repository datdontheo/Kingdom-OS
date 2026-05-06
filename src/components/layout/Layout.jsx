import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, CheckSquare,
  BookOpen, Target, FileText, Settings, Sun, Moon, Zap
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { useReminders } from '../../hooks/useReminders'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assistant', icon: MessageSquare, label: 'Assistant' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/teaching', icon: BookOpen, label: 'Teaching' },
  { to: '/projects', icon: Target, label: 'Projects' },
  { to: '/meetings', icon: FileText, label: 'Meetings' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function DesktopNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-[var(--accent-dim)] text-[var(--accent)] shadow-[0_0_0_1px_var(--border-glow)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function MobileNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
          isActive
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-muted)]'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.8} />
      <span style={{ fontSize: 9 }} className="font-medium">{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { theme, toggle } = useTheme()
  useReminders()

  return (
    <div className="flex h-svh overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Decorative background orbs */}
      <div className="bg-orb w-[600px] h-[600px] top-[-200px] left-[-100px]"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)' }} />
      <div className="bg-orb w-[400px] h-[400px] bottom-[-100px] right-[-50px]"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%)' }} />

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 z-10"
        style={{
          width: 'var(--nav-width)',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '16px 12px',
          gap: 4,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '8px 12px 20px' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))', boxShadow: '0 2px 12px var(--accent-glow)' }}>
              <Zap size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>Kingdom OS</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>KSM Console</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 flex flex-col gap-0.5">
          {NAV.map(n => <DesktopNavItem key={n.to} {...n} />)}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-blue))' }}>
              <Zap size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Kingdom OS</span>
          </div>
          <button onClick={toggle} style={{ color: 'var(--text-muted)', padding: 6 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
          style={{ background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-around px-1 py-1">
            {NAV.slice(0, 7).map(n => <MobileNavItem key={n.to} {...n} />)}
          </div>
        </nav>
      </div>
    </div>
  )
}
