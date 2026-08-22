import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Save, CheckCheck } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Avatar from '../../../components/ui/Avatar'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import studentService from '../../../services/students'
import attendanceService from '../../../services/attendance'
import { cn, todayISO } from '../../../utils/format'

export default function Attendance() {
  const toast = useToast()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('8')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [date, setDate] = useState(todayISO())
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const classOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const sectionOptions = ['A', 'B', 'C']

  useEffect(() => {
    attendanceService.getStats().then(setStats)
  }, [])

  useEffect(() => {
    setLoading(true)
    studentService.getAll().then(data => {
      const filtered = data.filter(s => {
        const matchClass = s.class.startsWith(classFilter + '-')
        const matchSection = sectionFilter === 'all' || s.class.endsWith('-' + sectionFilter)
        return matchClass && matchSection
      })
      setStudents(filtered)
      const initial = {}
      filtered.forEach(s => { initial[s.id] = 'Present' })
      setMarks(initial)
      setLoading(false)
    })
  }, [classFilter, sectionFilter, date])

  const setMark = (id, status) => {
    setMarks(prev => ({ ...prev, [id]: status }))
  }

  const markAllPresent = () => {
    const allPresent = {}
    students.forEach(s => { allPresent[s.id] = 'Present' })
    setMarks(allPresent)
    toast.success('All students marked present')
  }

  const handleSave = async () => {
    setSaving(true)
    const records = students.map(s => ({ studentId: s.id, status: marks[s.id] || 'Present' }))
    await attendanceService.save(classFilter, sectionFilter, date, records)
    setSaving(false)
    toast.success('Attendance saved successfully')
  }

  const presentCount = Object.values(marks).filter(s => s === 'Present').length
  const absentCount = Object.values(marks).filter(s => s === 'Absent').length
  const lateCount = Object.values(marks).filter(s => s === 'Late').length

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Mark and track student attendance"
        actions={
          <Button variant="secondary" onClick={markAllPresent}>
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All Present</span>
          </Button>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card><div><p className="text-sm text-ink-secondary">Average Attendance</p><p className="text-2xl font-semibold text-ink mt-1">{stats.averageAttendance}%</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Present Today</p><p className="text-2xl font-semibold text-success mt-1">{stats.presentToday}</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Absent Today</p><p className="text-2xl font-semibold text-danger mt-1">{stats.absentToday}</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Late Today</p><p className="text-2xl font-semibold text-warning mt-1">{stats.lateToday}</p></div></Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="flex-1">
            {classOptions.map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
          </Select>
          <Select label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="flex-1">
            <option value="all">All Sections</option>
            {sectionOptions.map(s => <option key={s} value={s}>{`Section ${s}`}</option>)}
          </Select>
          <div className="flex-1">
            <label className="label">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-4">
        <span className="badge bg-success-bg text-success">{presentCount} Present</span>
        <span className="badge bg-danger-bg text-danger">{absentCount} Absent</span>
        <span className="badge bg-warning-bg text-warning">{lateCount} Late</span>
      </div>

      {/* Student List */}
      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : students.length === 0 ? (
          <EmptyState title="No students found" description="No students in this class/section." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Student</th>
                    <th className="table-header">Roll No</th>
                    <th className="table-header text-center">Present</th>
                    <th className="table-header text-center">Absent</th>
                    <th className="table-header text-center">Late</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-border last:border-0">
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" />
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-ink-secondary">{student.rollNo || '—'}</td>
                      {['Present', 'Absent', 'Late'].map(status => (
                        <td key={status} className="table-cell text-center">
                          <button
                            onClick={() => setMark(student.id, status)}
                            className={cn(
                              'w-8 h-8 rounded-btn flex items-center justify-center transition-colors',
                              marks[student.id] === status
                                ? status === 'Present' ? 'bg-success-bg text-success'
                                : status === 'Absent' ? 'bg-danger-bg text-danger'
                                : 'bg-warning-bg text-warning'
                                : 'text-ink-muted hover:bg-surface-hover'
                            )}
                            aria-label={`Mark ${student.name} as ${status}`}
                          >
                            {status === 'Present' && <CheckCircle className="w-5 h-5" />}
                            {status === 'Absent' && <XCircle className="w-5 h-5" />}
                            {status === 'Late' && <Clock className="w-5 h-5" />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
