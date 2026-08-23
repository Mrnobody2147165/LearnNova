import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import LoadingState from '../../../components/ui/LoadingState'
import { studentAttendance } from '../../../data/academics'

export default function StudentAttendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecords(studentAttendance)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingState />

  const present = records.filter(a => a.status === 'Present').length
  const absent = records.filter(a => a.status === 'Absent').length
  const late = records.filter(a => a.status === 'Late').length
  const overall = Math.round((present / records.length) * 100)

  const statusConfig = {
    Present: { bg: 'bg-success-bg', text: 'text-success', icon: CheckCircle },
    Absent: { bg: 'bg-danger-bg', text: 'text-danger', icon: AlertCircle },
    Late: { bg: 'bg-warning-bg', text: 'text-warning', icon: Clock },
  }

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Your attendance record and overview" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-success-bg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{present}</p>
              <p className="text-xs text-ink-secondary">Present</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-danger-bg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{absent}</p>
              <p className="text-xs text-ink-secondary">Absent</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-warning-bg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{late}</p>
              <p className="text-xs text-ink-secondary">Late</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{overall}%</p>
              <p className="text-xs text-ink-secondary">Overall</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <h3 className="text-base font-semibold text-ink mb-4">Monthly Attendance</h3>
        <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2">
          {records.map((record, i) => {
            const config = statusConfig[record.status]
            const day = new Date(record.date).getDate()
            return (
              <div
                key={i}
                className={`aspect-square rounded-btn flex flex-col items-center justify-center ${config.bg} ${config.text} cursor-default`}
                title={`${record.date}: ${record.status}`}
              >
                <span className="text-sm font-semibold">{day}</span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-btn bg-success-bg" />
            <span className="text-xs text-ink-secondary">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-btn bg-warning-bg" />
            <span className="text-xs text-ink-secondary">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-btn bg-danger-bg" />
            <span className="text-xs text-ink-secondary">Absent</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
