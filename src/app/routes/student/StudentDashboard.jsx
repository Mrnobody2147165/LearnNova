import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, GraduationCap, ClipboardList, BookOpen, ArrowRight, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useAuthStore } from '../../../stores/authStore'
import subjectService from '../../../services/subjects'
import examService from '../../../services/exams'
import homeworkService from '../../../services/homework'
import attendanceService from '../../../services/attendance'
import challanService from '../../../services/challans'
import { formatDateShort, formatPKRFull } from '../../../utils/format'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [upcomingExams, setUpcomingExams] = useState([])
  const [activeHomework, setActiveHomework] = useState([])
  const [pendingChallan, setPendingChallan] = useState(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = user?.name?.split(' ')[0] || 'Student'

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class

    Promise.all([
      subjectService.getStudentSubjects(studentId, studentClass),
      examService.getStudentGrades(studentId),
      attendanceService.getStudentAttendance(studentId),
      examService.getExams({ classFilter: studentClass }),
      homeworkService.getHomeworkList({ classFilter: studentClass, status: 'Active' }),
      homeworkService.getSubmissions(null, studentId),
      challanService.getStudentChallans(studentId),
    ]).then(([subData, grdData, attData, exData, hwData, subms, chData]) => {
      setSubjects(subData || [])
      setGrades(grdData || [])
      setAttendance(attData || [])
      setUpcomingExams(exData ? exData.filter(e => e.status === 'Scheduled') : [])

      const mappedHw = (hwData || []).map(h => {
        const sub = (subms || []).find(s => s.homeworkId === h.id)
        return { ...h, submissionStatus: sub?.status || 'Pending' }
      })
      setActiveHomework(mappedHw)

      const pending = (chData || []).find(c => c.status === 'Pending' || c.status === 'Overdue')
      setPendingChallan(pending || null)
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const presentCount = attendance.filter(a => a.status === 'Present').length
  const attendancePct = attendance.length > 0 ? `${Math.round((presentCount / attendance.length) * 100)}%` : '0%'
  const avgGrade = grades.length > 0 ? `${Math.round(grades.reduce((sum, g) => sum + (g.overall || 0), 0) / grades.length)}%` : '0%'
  const pendingHomework = activeHomework.filter(h => h.submissionStatus === 'Pending').length

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userName}.`}
        subtitle="Here's your academic overview."
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
        <StatCard label="Average Grade" value={avgGrade} icon={GraduationCap} />
        <StatCard label="Homework" value={`${pendingHomework} Pending`} icon={ClipboardList} />
        <StatCard label="Upcoming Exams" value={upcomingExams.length} icon={BookOpen} />
      </div>

      {/* Subject Progress + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Subject Progress */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Subject Progress</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/subjects')}>
              View Progress
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">No subjects enrolled yet</p>
          ) : (
            <div className="space-y-4">
              {subjects.map(subject => (
                <div key={subject.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-ink">{subject.name}</span>
                    <span className="text-xs text-ink-secondary">{subject.progress}%</span>
                  </div>
                  <div className="h-2 bg-surface-app rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Upcoming Exams</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/exams')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">No exams scheduled currently</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 3).map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
                  <div>
                    <h4 className="text-sm font-semibold text-ink">{exam.subject}</h4>
                    <p className="text-xs text-ink-muted mt-0.5">{exam.name}</p>
                    <div className="flex items-center gap-1 text-xs text-ink-muted mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{exam.startTime}</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary">{formatDateShort(exam.date)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Active Homework + Subject Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Homework */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Active Homework</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/homework')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {activeHomework.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">No homework assignments active</p>
          ) : (
            <div className="space-y-3">
              {activeHomework.slice(0, 3).map(hw => (
                <div
                  key={hw.id}
                  className="flex items-center justify-between p-3 rounded-btn bg-surface-app hover:bg-surface-hover cursor-pointer transition-colors"
                  onClick={() => navigate(`/student/homework/${hw.id}`)}
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <h4 className="text-sm font-semibold text-ink truncate">{hw.title}</h4>
                    <p className="text-xs text-ink-muted mt-0.5">{hw.subject} • Due {formatDateShort(hw.dueDate)}</p>
                  </div>
                  <StatusBadge status={hw.submissionStatus} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Subject Grades Breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Subject Grades</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/grades')}>
              Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {grades.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-6">No exam grades published yet</p>
          ) : (
            <div className="space-y-3">
              {grades.map(grade => (
                <div key={grade.id || grade.subject} className="flex items-center justify-between p-3 rounded-btn bg-surface-app">
                  <span className="text-sm font-medium text-ink">{grade.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{grade.overall}%</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-success-light text-success font-semibold">{grade.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
