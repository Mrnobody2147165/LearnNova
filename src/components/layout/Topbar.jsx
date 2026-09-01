import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, LogOut, User as UserIcon, Bell } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import { useNotificationStore } from '../../stores/notificationStore'
import studentService from '../../services/students'
import challanService from '../../services/challans'
import Avatar from '../ui/Avatar'

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { fetchSchoolFromDB } = useSchoolStore()
  const { notifications, unreadCount, fetchNotifications } = useNotificationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [challans, setChallans] = useState([])
  const searchRef = useRef(null)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  const isStudentPortal = location.pathname.startsWith('/student')
  const unread = unreadCount()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchSchoolFromDB()
    fetchNotifications()
    Promise.all([
      studentService.getAll(),
      challanService.getAll(),
    ]).then(([stData, chData]) => {
      setStudents(stData || [])
      setChallans(chData || [])
    }).catch(err => console.warn('Topbar prefetch warning:', err))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = searchQuery.length > 1 ? [
    ...students
      .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.id?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(s => ({ type: 'Student', label: s.name, sub: `${s.id} • ${s.class}`, link: `/admin/students/${s.id}` })),
    ...challans
      .filter(ch => ch.challanNo?.toLowerCase().includes(searchQuery.toLowerCase()) || ch.studentName?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 4)
      .map(ch => ({ type: 'Challan', label: ch.challanNo, sub: `${ch.studentName} • ${ch.month}`, link: `/admin/challans/${ch.id}` })),
  ] : []

  const handleSearchClick = (result) => {
    navigate(result.link)
    setSearchOpen(false)
    setSearchQuery('')
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

      {/* Portal label */}
      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-surface-app border border-border text-xs font-semibold text-ink-secondary">
        {isStudentPortal ? (
          <>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Student Portal
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-primary" />
            Admin Portal
          </>
        )}
      </span>

      {/* Global search — admin only */}
      {!isStudentPortal && (
        <div ref={searchRef} className="relative flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search students, challans, payments..."
              className="input pl-9 pr-4 py-1.5 text-sm w-full bg-surface-app"
            />
          </div>

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-card shadow-dropdown border border-border overflow-hidden z-50">
              <div className="p-1">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => handleSearchClick(r)}
                    className="flex items-center justify-between px-3 py-2 rounded-btn hover:bg-surface-hover cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{r.label}</p>
                      <p className="text-xs text-ink-muted">{r.sub}</p>
                    </div>
                    <span className="text-xs font-medium text-primary px-2 py-0.5 rounded bg-primary-light">
                      {r.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2.5 ml-auto">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-btn hover:bg-surface-hover transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-ink-secondary" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-card shadow-dropdown border border-border py-1 z-50 max-h-80 overflow-y-auto">
              <div className="px-3 py-2 border-b border-border mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={() => {
                      useNotificationStore.getState().markAllRead()
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-ink-muted">No notifications yet</p>
              ) : (
                notifications.slice(0, 10).map(n => (
                  <div
                    key={n.id}
                    className={`px-3 py-2 border-b border-border last:border-0 ${!n.read ? 'bg-primary-light/30' : ''}`}
                  >
                    <p className="text-sm text-ink">{n.title || n.message || 'Notification'}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{n.time || 'Recently'}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-btn hover:bg-surface-hover transition-colors"
          >
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-ink">{user?.name || 'Admin'}</p>
              <p className="text-xs text-ink-muted capitalize">{user?.role || 'admin'}</p>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-card shadow-dropdown border border-border py-1 z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-ink truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-ink-muted capitalize">{user?.role || 'admin'}</p>
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/admin/settings')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-ink-muted" />
                  <span>Settings</span>
                </button>
              )}

              {user?.role === 'student' && (
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/student/profile')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-ink-muted" />
                  <span>My Profile</span>
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
