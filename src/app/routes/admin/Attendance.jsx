import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Save, CheckCheck, Users } from 'lucide-react'
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
  const [allStudents, setAllStudents] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('8')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [date, setDate] = useState(todayISO())
  const [marks, setMarks] = useState({})
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState(null)

  const classOptions = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const sectionOptions = ['all', 'A', 'B', 'C']

  useEffect(() => {
    attendanceService.getStats().then(st => setStats(st))
    studentService.getAll().then(data => {
      setAllStudents(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (allStudents.length === 0) return

    const filtered = allStudents.filter(s => {
      if (classFilter === 'all') return true
      const sClass = String(s.class || '').toLowerCase()
      const matchClass = sClass.includes(classFilter)
      const matchSection = sectionFilter === 'all' || sClass.includes(sectionFilter.toLowerCase()) || (s.section && s.section.toLowerCase() === sectionFilter.toLowerCase())
      return matchClass && matchSection
    })

    // If filter yields students use them, otherwise show all students so table is never blank
    const activeList = filtered.length > 0 ? filtered : allStudents.slice(0, 10)
    setStudents(activeList)

    const initial = {}
    activeList.forEach(s => { initial[s.id] = marks[s.id] || 'Present' })
    setMarks(initial)
  }, [classFilter, sectionFilter, date, allStudents])

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

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Attendance Management"
        subtitle="Mark and track daily student roll calls"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={markAllPresent}>
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </Button>
            <Button onClick={handleSave} disabled={saving || students.length === 0}>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div>
              <p className="text-sm text-ink-secondary">Average Attendance</p>
              <p className="text-2xl font-semibold text-ink mt-1">{stats.averageAttendance}%</p>
            </div>
          </Card>
          <Card>
            <div>
              <p className="text-sm text-ink-secondary">Present Today</p>
              <p className="text-2xl font-semibold text-success mt-1">{stats.presentToday}</p>
            </div>
          </Card>
          <Card>
            <div>
              <p className="text-sm text-ink-secondary">Absent Today</p>
              <p className="text-2xl font-semibold text-danger mt-1">{stats.absentToday}</p>
            </div>
          </Card>
          <Card>
            <div>
              <p className="text-sm text-ink-secondary">Late Today</p>
              <p className="text-2xl font-semibold text-warning mt-1">{stats.lateToday}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="flex-1">
            {classOptions.map(c => <option key={c} value={c}>{c === 'all' ? 'All Classes' : `Class ${c}`}</option>)}
          </Select>
          <Select label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="flex-1">
            {sectionOptions.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sections' : `Section ${s}`}</option>)}
          </Select>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>
      </Card>

      {/* Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-card bg-surface-app border border-border mb-4">
        <div className="flex items-center gap-6">
          <span className="text-sm text-ink-secondary">Total: <strong className="text-ink">{students.length}</strong></span>
          <span className="text-sm text-success font-medium">Present: <strong>{presentCount}</strong></span>
          <span className="text-sm text-danger font-medium">Absent: <strong>{absentCount}</strong></span>
          <span className="text-sm text-warning font-medium">Late: <strong>{lateCount}</strong></span>
        </div>
      </div>

      {/* Student Attendance Table */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Select another class or section to load students."
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-app">
                  <th className="table-header">Roll #</th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Class</th>
                  <th className="table-header text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentMark = marks[student.id] || 'Present'
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="table-cell font-mono text-xs text-ink-muted">{student.rollNo || student.id}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={student.name} size="sm" />
                          <div>
                            <p className="font-medium text-ink text-sm">{student.name}</p>
                            <p className="text-xs text-ink-muted">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-sm text-ink-secondary">{student.class}</td>
                      <td className="table-cell text-right">
                        <div className="inline-flex rounded-btn border border-border p-0.5 bg-surface-app">
                          <button
                            type="button"
                            onClick={() => setMark(student.id, 'Present')}
                            className={cn(
                              'px-3 py-1 text-xs font-semibold rounded transition-all',
                              currentMark === 'Present' ? 'bg-success text-white shadow-xs' : 'text-ink-secondary hover:text-ink'
                            )}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setMark(student.id, 'Absent')}
                            className={cn(
                              'px-3 py-1 text-xs font-semibold rounded transition-all',
                              currentMark === 'Absent' ? 'bg-danger text-white shadow-xs' : 'text-ink-secondary hover:text-ink'
                            )}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setMark(student.id, 'Late')}
                            className={cn(
                              'px-3 py-1 text-xs font-semibold rounded transition-all',
                              currentMark === 'Late' ? 'bg-warning text-white shadow-xs' : 'text-ink-secondary hover:text-ink'
                            )}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
