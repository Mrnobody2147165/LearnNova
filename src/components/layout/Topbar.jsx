import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Menu, Check, CheckCheck, LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore } from '../../stores/notificationStore'
import { useSchoolStore } from '../../stores/schoolStore'
import studentService from '../../services/students'
import challanService from '../../services/challans'
import { cn, initials } from '../../utils/format'
import Avatar from '../ui/Avatar'

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { school } = useSchoolStore()
  const { notifications, markAsRead, markAllRead } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [challans, setChallans] = useState([])
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    Promise.all([
      studentService.getAll(),
      studentService.getTeachers(),
      studentService.getClasses(),
      challanService.getAll(),
    ]).then(([sData, tData, cData, chData]) => {
      setStudents(sData || [])
      setTeachers(tData || [])
      setClasses(cData || [])
      setChallans(chData || [])
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = searchQuery.length > 1 ? [
    ...students
      .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.id?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 4)
      .map(s => ({ type: 'Student', label: s.name, sub: `${s.id} • Class ${s.class}`, link: `/students/${s.id}` })),
    ...teachers
      .filter(t => t.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(t => ({ type: 'Teacher', label: t.name, sub: t.id, link: '/teachers' })),
    ...classes
      .filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(c => ({ type: 'Class', label: c.name, sub: `${c.students || 0} students`, link: '/classes' })),
    ...challans
      .filter(ch => ch.challanNo?.toLowerCase().includes(searchQuery.toLowerCase()) || ch.studentName?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(ch => ({ type: 'Challan', label: ch.challanNo, sub: `${ch.studentName} • ${ch.month}`, link: `/challans/${ch.id}` })),
  ] : []

  const handleSearchClick = (result) => {
    navigate(result.link)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const notifIcon = (type) => {
    const colors = { warning: 'bg-warning-bg text-warning', info: 'bg-info-bg text-info', success: 'bg-success-bg text-success' }
    return colors[type] || colors.info
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border h-16 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-btn hover:bg-surface-hover"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search students, teachers, challans..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-surface-app rounded-btn border border-transparent focus:border-border focus:bg-white focus:outline-none transition-colors"
        />
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-card shadow-dropdown border border-border max-h-80 overflow-y-auto z-50">
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSearchClick(result)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover text-left transition-colors"
              >
                <span className="text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full whitespace-nowrap">
                  {result.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{result.label}</p>
                  <p className="text-xs text-ink-muted truncate">{result.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {searchOpen && searchQuery.length > 1 && searchResults.length === 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-card shadow-dropdown border border-border p-4 text-center text-sm text-ink-muted z-50">
            No results found for "{searchQuery}"
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-btn hover:bg-surface-hover transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-ink-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-card shadow-dropdown border border-border max-h-96 overflow-y-auto z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={cn('flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-hover cursor-pointer', !n.read && 'bg-primary-50/30')}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', notifIcon(n.type))}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink truncate">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-ink-secondary mt-0.5">{n.message}</p>
                    <p className="text-xs text-ink-muted mt-1">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-btn hover:bg-surface-hover transition-colors"
          >
            <Avatar name={user?.name || 'Admin'} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-ink">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-ink-muted">{user?.role || 'admin'}</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-card shadow-dropdown border border-border py-1 z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-ink truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-ink-muted capitalize">{user?.role || 'student'} {user?.class ? `• Class ${user.class}` : ''}</p>
              </div>

              {user?.role === 'admin' ? (
                <>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/settings') }}
                    className="w-full px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/teacher') }}
                    className="w-full px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                  >
                    Teacher Portal
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/parent') }}
                    className="w-full px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                  >
                    Parent Portal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setProfileOpen(false); navigate('/student/profile') }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-ink-muted" />
                  My Profile
                </button>
              )}

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-danger hover:bg-danger-light transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 text-danger" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
