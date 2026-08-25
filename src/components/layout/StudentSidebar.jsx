import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, GraduationCap, CalendarCheck,
  ClipboardList, TrendingUp, CalendarDays, Bell, User, LogOut, X, Wallet, GraduationCap as Logo
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../utils/format'

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/subjects', label: 'My Subjects', icon: BookOpen },
  { to: '/student/grades', label: 'Grades', icon: GraduationCap },
  { to: '/student/exams', label: 'Exams', icon: ClipboardList },
  { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/student/homework', label: 'Homework', icon: ClipboardList },
  { to: '/student/fees', label: 'Fees & Challans', icon: Wallet },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/profile', label: 'Profile', icon: User },
]

export default function StudentSidebar({ mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-btn bg-primary flex items-center justify-center flex-shrink-0">
          <Logo className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">Learnify</p>
          <p className="text-xs text-ink-muted truncate">Student Portal</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-ink-muted hover:text-ink"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User info */}
      <div className="px-5 py-3 border-b border-border">
        <p className="text-sm font-medium text-ink truncate">{user?.name || 'Student'}</p>
        <p className="text-xs text-ink-muted truncate">{user?.studentId || ''} • Class {user?.class || ''}-{user?.section || ''}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn('nav-item', isActive && 'nav-item-active')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-border">
        <button onClick={handleLogout} className="nav-item w-full text-left">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-border h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-modal animate-[slideIn_0.2s_ease-out]">
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
