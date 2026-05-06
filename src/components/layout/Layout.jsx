import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, Users, CheckSquare,
  BookOpen, Target, FileText, Settings
} from 'lucide-react'

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

function NavItem({ to, icon: Icon, label, mobile }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        mobile
          ? `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              isActive
                ? 'text-violet-400'
                : 'text-gray-500 hover:text-gray-300'
            }`
          : `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-violet-950/60 text-violet-300 border border-violet-800/40'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
            }`
      }
    >
      <Icon size={mobile ? 20 : 18} strokeWidth={1.8} />
      <span className={mobile ? 'text-[10px]' : ''}>{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  return (
    <div className="flex h-svh overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-800/60 bg-gray-900/40 p-3 gap-1">
        <div className="px-3 py-4 mb-2">
          <h1 className="text-base font-semibold text-white tracking-wide">Kingdom OS</h1>
          <p className="text-xs text-gray-500 mt-0.5">KSM Ministry Console</p>
        </div>
        {NAV.map(n => <NavItem key={n.to} {...n} />)}
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800/60 z-50">
          <div className="flex items-center justify-around px-1 py-1">
            {NAV.slice(0, 7).map(n => <NavItem key={n.to} {...n} mobile />)}
          </div>
        </nav>
      </div>
    </div>
  )
}
