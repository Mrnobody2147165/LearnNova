import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, ClipboardList, ArrowRight, CheckCircle, Wallet } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import { useAuthStore } from '../../../stores/authStore'
import homeworkService from '../../../services/homework'
import attendanceService from '../../../services/attendance'
import challanService from '../../../services/challans'
import { formatDateShort, formatPKRFull } from '../../../utils/format'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState([])
  const [activeHomework, setActiveHomework] = useState([])
  const [pendingChallan, setPendingChallan] = useState(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = user?.name?.split(' ')[0] || 'Student'

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class

    Promise.all([
      attendanceService.getStudentAttendance(studentId).catch(() => []),
      homeworkService.getHomeworkList({ classFilter: studentClass, status: 'Active' }).catch(() => []),
      homeworkService.getSubmissions(null, studentId).catch(() => []),
      challanService.getStudentChallans(studentId).catch(() => []),
    ]).then(([attData, hwData, subms, chData]) => {
      setAttendance(attData || [])

      const mappedHw = (hwData || []).map(h => {
        const sub = (subms || []).find(s => s.homeworkId === h.id)
        return { ...h, submissionStatus: sub?.status || 'Pending' }
      })
      setActiveHomework(mappedHw)

      const pending = (chData || []).find(c => c.status === 'Pending' || c.status === 'Overdue')
      setPendingChallan(pending || null)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const presentCount = attendance.filter(a => a.status === 'Present').length
  const attendancePct = attendance.length > 0 ? `${Math.round((presentCount / attendance.length) * 100)}%` : '0%'
  const pendingHomework = activeHomework.filter(h => h.submissionStatus === 'Pending').length
  const submittedHomework = activeHomework.filter(h => h.submissionStatus === 'Submitted' || h.submissionStatus === 'Graded').length

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userName}.`}
        subtitle="Here's your learning and fee overview."
      />

      {/* Fee Alert Banner if pending */}
      {pendingChallan && (
        <div className="mb-6 p-4 rounded-card bg-primary-50 border border-primary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Monthly Fee Challan ({pendingChallan.month}) is Ready
              </p>
              <p className="text-xs text-ink-secondary">
                Amount payable: <strong>{formatPKRFull(pendingChallan.total)}</strong> • Due date: {formatDateShort(pendingChallan.dueDate)}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/student/fees')}>
            View & Pay Fee
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance" value={attendancePct} icon={CalendarCheck} />
        <StatCard label="Pending Homework" value={pendingHomework} icon={ClipboardList} />
        <StatCard label="Submitted Tasks" value={submittedHomework} icon={CheckCircle} />
        <StatCard label="Fee Status" value={pendingChallan ? 'Payment Due' : 'Up to Date'} icon={Wallet} />
      </div>

      {/* Attendance Summary */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink">Attendance Summary</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/attendance')}>
            View History
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-ink-secondary">Present</span>
              <span className="text-sm font-semibold text-success">{attendancePct}</span>
            </div>
            <div className="h-2 bg-surface-app rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: attendancePct }} />
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-ink-muted border-t border-border">
            <span>Class: {user?.class || '8'}-{user?.section || 'B'}</span>
            <span>Roll No: {user?.studentId || 'STU-2026-00124'}</span>
          </div>
        </div>
      </Card>

      {/* Active Homework & Assignments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink">Active Homework & Assignments</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/homework')}>
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {activeHomework.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-6">No homework assignments active currently</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeHomework.slice(0, 6).map(hw => (
              <div
                key={hw.id}
                className="p-3.5 rounded-card border border-border bg-white hover:border-primary cursor-pointer transition-all flex flex-col justify-between"
                onClick={() => navigate(`/student/homework/${hw.id}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-primary">{hw.subject}</span>
                    <StatusBadge status={hw.submissionStatus} />
                  </div>
                  <h4 className="text-sm font-semibold text-ink line-clamp-1">{hw.title}</h4>
                  <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{hw.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <span>Due {formatDateShort(hw.dueDate)}</span>
                  <span className="text-primary font-medium flex items-center gap-0.5">Submit <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
