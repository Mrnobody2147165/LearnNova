import { useNavigate } from 'react-router-dom'
import { CalendarCheck, GraduationCap, ClipboardList, BookOpen, TrendingUp, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import { useAuthStore } from '../../../stores/authStore'
import { studentSubjects, studentGrades, studentAttendance, homework, homeworkSubmissions, exams } from '../../../data/academics'
import { formatDateShort } from '../../../utils/format'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const userName = user?.name?.split(' ')[0] || 'Student'

  const presentCount = studentAttendance.filter(a => a.status === 'Present').length
  const absentCount = studentAttendance.filter(a => a.status === 'Absent').length
  const lateCount = studentAttendance.filter(a => a.status === 'Late').length
  const attendancePct = Math.round((presentCount / studentAttendance.length) * 100)

  const avgGrade = Math.round(studentGrades.reduce((sum, g) => sum + g.overall, 0) / studentGrades.length)

  const mySubmissions = homeworkSubmissions.filter(s => s.studentId === 'STU-2026-00124')
  const pendingHomework = mySubmissions.filter(s => s.status === 'Pending').length

  const upcomingExams = exams.filter(e => e.status === 'Scheduled')

  const activeHomework = homework.filter(h => h.status === 'Active').map(h => {
    const sub = mySubmissions.find(s => s.homeworkId === h.id)
    return { ...h, submissionStatus: sub?.status || 'Pending' }
  })

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${userName}.`}
        subtitle="Here's your academic overview."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance" value={`${attendancePct}%`} icon={CalendarCheck} />
        <StatCard label="Average Grade" value={`${avgGrade}%`} icon={GraduationCap} />
        <StatCard label="Homework" value={`${pendingHomework} Pending`} icon={ClipboardList} />
        <StatCard label="Upcoming Exams" value={upcomingExams.length} icon={BookOpen} />
      </div>

      {/* Subject Progress + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Subject Progress */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Subject Progress</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/progress')}>
              View Progress
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-4">
            {studentSubjects.map(subject => (
              <div key={subject.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink">{subject.name}</span>
                  <span className="text-sm font-semibold text-ink">{subject.progress}%</span>
                </div>
                <div className="h-2 bg-surface-app rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-3">
            {upcomingExams.slice(0, 3).map(exam => (
              <div
                key={exam.id}
                className="p-3 rounded-btn bg-surface-app border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate('/student/exams')}
              >
                <p className="text-sm font-medium text-ink">{exam.subject}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateShort(exam.date)}</span>
                  <span>{exam.startTime}</span>
                </div>
                <p className="text-xs text-ink-secondary mt-1">{exam.description}</p>
              </div>
            ))}
            {upcomingExams.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-4">No upcoming exams</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Grades + Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Grades */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Recent Grades</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/grades')}>
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            {studentGrades.map(grade => (
              <div key={grade.subjectId} className="flex items-center justify-between p-2.5 rounded-btn hover:bg-surface-hover">
                <span className="text-sm font-medium text-ink">{grade.subject}</span>
                <span className="text-sm font-semibold text-success">{grade.overall}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Homework */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Homework</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/student/homework')}>
              View Homework
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="space-y-3">
            {activeHomework.slice(0, 4).map(hw => (
              <div
                key={hw.id}
                className="flex items-center justify-between p-2.5 rounded-btn hover:bg-surface-hover cursor-pointer"
                onClick={() => navigate(`/student/homework/${hw.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{hw.title}</p>
                  <p className="text-xs text-ink-muted">{hw.subject} • Due {formatDateShort(hw.dueDate)}</p>
                </div>
                <StatusBadge status={hw.submissionStatus === 'Pending' ? 'Pending' : 'Submitted'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Attendance Overview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink">Attendance Overview</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/attendance')}>
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-btn bg-success-bg">
            <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xl font-semibold text-ink">{presentCount}</p>
            <p className="text-xs text-ink-secondary">Present</p>
          </div>
          <div className="text-center p-3 rounded-btn bg-danger-bg">
            <AlertCircle className="w-5 h-5 text-danger mx-auto mb-1" />
            <p className="text-xl font-semibold text-ink">{absentCount}</p>
            <p className="text-xs text-ink-secondary">Absent</p>
          </div>
          <div className="text-center p-3 rounded-btn bg-warning-bg">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-semibold text-ink">{lateCount}</p>
            <p className="text-xs text-ink-secondary">Late</p>
          </div>
          <div className="text-center p-3 rounded-btn bg-primary-light">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-semibold text-ink">{attendancePct}%</p>
            <p className="text-xs text-ink-secondary">Overall</p>
          </div>
        </div>
        {/* Mini calendar */}
        <div className="flex flex-wrap gap-1.5">
          {studentAttendance.slice(0, 20).map((a, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-btn flex items-center justify-center text-xs font-medium ${
                a.status === 'Present' ? 'bg-success-bg text-success' :
                a.status === 'Absent' ? 'bg-danger-bg text-danger' :
                'bg-warning-bg text-warning'
              }`}
              title={`${a.date}: ${a.status}`}
            >
              {new Date(a.date).getDate()}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
