import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Wallet, FileText, CreditCard, CalendarCheck, BookMarked,
  BarChart3, Sparkles, Settings, LogOut, X, ClipboardList, Award, Library
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { cn } from '../../utils/format'

const navSections = [
  {
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/students', label: 'Students', icon: Users },
      { to: '/teachers', label: 'Teachers', icon: GraduationCap },
      { to: '/classes', label: 'Classes', icon: BookOpen },
      { to: '/subjects', label: 'Subjects', icon: Library },
    ],
  },
  {
    label: 'Academics',
    items: [
      { to: '/academics/exams', label: 'Exams', icon: ClipboardList },
      { to: '/academics/grades', label: 'Grades', icon: Award },
      { to: '/academics/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/academics/homework', label: 'Homework', icon: BookMarked },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/fees', label: 'Fees', icon: Wallet },
      { to: '/challans', label: 'E-Challans', icon: FileText },
      { to: '/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/communications', label: 'Communications', icon: BookOpen },
      { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
]

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { school } = useSchoolStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-btn bg-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{school.name}</p>
          <p className="text-xs text-ink-muted truncate">Admin Portal</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1 text-ink-muted hover:text-ink"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="px-3 mb-1.5 text-xs font-medium text-ink-muted uppercase tracking-wide">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
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
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full text-left">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-border h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
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
