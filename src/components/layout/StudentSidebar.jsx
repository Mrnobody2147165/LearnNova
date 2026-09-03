import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarCheck,
  ClipboardList, User, LogOut, X, Wallet, GraduationCap as Logo,
  BookOpen, Award, FileText, TrendingUp, Calendar, Bell
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { cn } from '../../utils/format'

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/subjects', label: 'My Subjects', icon: BookOpen },
  { to: '/student/grades', label: 'Grades', icon: Award },
  { to: '/student/exams', label: 'Exams', icon: FileText },
  { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/student/homework', label: 'Homework', icon: ClipboardList },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/schedule', label: 'Schedule', icon: Calendar },
  { to: '/student/fees', label: 'Fees & Challans', icon: Wallet },
  { to: '/student/notifications', label: 'Notifications', icon: Bell, badge: true },
  { to: '/student/profile', label: 'Profile', icon: User },
]

export default function StudentSidebar({ mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const unread = unreadCount()

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-btn bg-primary flex items-center justify-center flex-shrink-0">
          <Logo className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">LearnNova</p>
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
        <p className="text-xs text-ink-muted truncate">{user?.studentId || ''} &bull; Class {user?.class || ''}-{user?.section || ''}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon
          const badgeCount = item.badge ? unread : 0
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
              <span className="truncate flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
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
