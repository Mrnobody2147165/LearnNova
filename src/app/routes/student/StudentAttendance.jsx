import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import attendanceService from '../../../services/attendance'
import { useAuthStore } from '../../../stores/authStore'
import { formatDate } from '../../../utils/format'

export default function StudentAttendance() {
  const { user } = useAuthStore()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    attendanceService.getStudentAttendance(studentId).then(data => {
      setAttendance(data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const present = attendance.filter(a => a.status === 'Present').length
  const absent = attendance.filter(a => a.status === 'Absent').length
  const late = attendance.filter(a => a.status === 'Late').length
  const total = attendance.length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div>
      <PageHeader title="Attendance Record" subtitle="Your daily attendance record for the current session" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attendance Rate" value={`${pct}%`} icon={Calendar} />
        <StatCard label="Present Days" value={present} icon={CheckCircle} />
        <StatCard label="Absent Days" value={absent} icon={XCircle} />
        <StatCard label="Late Days" value={late} icon={Clock} />
      </div>

      {attendance.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No attendance records found"
          description="Your daily attendance check-ins will appear here once marked by your teacher."
        />
      ) : (
        <Card padding={false}>
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Attendance Log</h3>
            <span className="text-xs text-ink-muted">{attendance.length} Records</span>
          </div>
          <div className="divide-y divide-border">
            {attendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-3">
                  {record.status === 'Present' && <CheckCircle className="w-5 h-5 text-success" />}
                  {record.status === 'Absent' && <XCircle className="w-5 h-5 text-danger" />}
                  {record.status === 'Late' && <Clock className="w-5 h-5 text-warning" />}
                  <div>
                    <p className="text-sm font-medium text-ink">{formatDate(record.date)}</p>
                    {record.remarks && <p className="text-xs text-ink-muted">{record.remarks}</p>}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  record.status === 'Present' ? 'bg-success-light text-success' :
                  record.status === 'Absent' ? 'bg-danger-light text-danger' :
                  'bg-warning-light text-warning'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
