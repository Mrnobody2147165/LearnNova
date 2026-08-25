import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu, LogOut, User as UserIcon, GraduationCap, Shield } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useSchoolStore } from '../../stores/schoolStore'
import studentService from '../../services/students'
import challanService from '../../services/challans'
import { cn } from '../../utils/format'
import Avatar from '../ui/Avatar'

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, switchRole } = useAuthStore()
  const { fetchSchoolFromDB } = useSchoolStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [challans, setChallans] = useState([])
  const searchRef = useRef(null)
  const profileRef = useRef(null)

  const isStudentPortal = location.pathname.startsWith('/student')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchSchoolFromDB()
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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = searchQuery.length > 1 ? [
    ...students
      .filter(s => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.id?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(s => ({ type: 'Student', label: s.name, sub: `${s.id} • ${s.class}`, link: `/students/${s.id}` })),
    ...challans
      .filter(ch => ch.challanNo?.toLowerCase().includes(searchQuery.toLowerCase()) || ch.studentName?.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 4)
      .map(ch => ({ type: 'Challan', label: ch.challanNo, sub: `${ch.studentName} • ${ch.month}`, link: `/challans/${ch.id}` })),
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

      {/* Global search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
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

      <div className="flex items-center gap-2.5 ml-auto">
        {/* Modern Portal Switcher Segmented Pill */}
        <div className="flex items-center p-1 bg-surface-app border border-border rounded-btn gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => {
              switchRole('admin')
              navigate('/dashboard')
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-150',
              !isStudentPortal
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-white/80'
            )}
            title="Switch to Admin Management Portal"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Portal</span>
            <span className="sm:hidden">Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              switchRole('student')
              navigate('/student/dashboard')
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-150',
              isStudentPortal
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-white/80'
            )}
            title="Switch to Student Learning Portal"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Student Portal</span>
            <span className="sm:hidden">Student</span>
          </button>
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

              {/* Portal navigation options */}
              <button
                onClick={() => {
                  setProfileOpen(false)
                  switchRole('admin')
                  navigate('/dashboard')
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
              >
                <Shield className="w-4 h-4 text-ink-muted" />
                <span>Admin Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false)
                  switchRole('student')
                  navigate('/student/dashboard')
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-ink-muted" />
                <span>Student Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false)
                  switchRole('student')
                  navigate('/student/fees')
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
              >
                <UserIcon className="w-4 h-4 text-ink-muted" />
                <span>Student Fees</span>
              </button>

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
