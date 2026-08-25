import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Avatar from '../../../components/ui/Avatar'
import StatusBadge from '../../../components/ui/StatusBadge'
import Tabs from '../../../components/ui/Tabs'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import studentService from '../../../services/students'
import challanService from '../../../services/challans'
import { formatPKRFull, formatDate, cn } from '../../../utils/format'

const mockResults = [
  { subject: 'Mathematics', marks: 87, grade: 'A', total: 100 },
  { subject: 'English', marks: 78, grade: 'B+', total: 100 },
  { subject: 'Physics', marks: 82, grade: 'A-', total: 100 },
  { subject: 'Chemistry', marks: 91, grade: 'A+', total: 100 },
  { subject: 'Biology', marks: 75, grade: 'B+', total: 100 },
  { subject: 'Urdu', marks: 84, grade: 'A', total: 100 },
  { subject: 'Islamic Studies', marks: 88, grade: 'A', total: 100 },
]

const mockAttendance = [
  { date: '2026-08-18', status: 'Present' },
  { date: '2026-08-17', status: 'Present' },
  { date: '2026-08-16', status: 'Late' },
  { date: '2026-08-15', status: 'Present' },
  { date: '2026-08-14', status: 'Absent' },
  { date: '2026-08-13', status: 'Present' },
  { date: '2026-08-12', status: 'Present' },
  { date: '2026-08-11', status: 'Present' },
  { date: '2026-08-10', status: 'Late' },
  { date: '2026-08-09', status: 'Present' },
]

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      studentService.getById(id),
      challanService.getAll({ search: id }),
    ]).then(([sData, cData]) => {
      setStudent(sData)
      setChallans(cData || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingState />
  if (!student) return <EmptyState title="Student not found" description="The student you're looking for doesn't exist." action={<Button onClick={() => navigate('/students')}>Back to Students</Button>} />

  const studentChallans = challans.length > 0 ? challans : (student.challans || [])
  const paidChallans = studentChallans.filter(c => c.status === 'Paid')
  const pendingChallans = studentChallans.filter(c => c.status === 'Pending' || c.status === 'Overdue')
  const outstanding = pendingChallans.reduce((sum, c) => sum + (c.total || c.total_amount || 0), 0)
  const totalPaid = paidChallans.reduce((sum, c) => sum + (c.total || c.total_amount || 0), 0)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'academics', label: 'Academics' },
    { id: 'grades', label: 'Grades' },
    { id: 'exams', label: 'Exams' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'homework', label: 'Homework' },
    { id: 'fees', label: 'Fees' },
  ]

  const gradeColor = (grade) => {
    if (grade.startsWith('A+')) return 'text-success'
    if (grade.startsWith('A')) return 'text-success'
    if (grade.startsWith('B')) return 'text-info'
    return 'text-warning'
  }

  const attIcon = (status) => {
    if (status === 'Present') return <CheckCircle className="w-4 h-4 text-success" />
    if (status === 'Absent') return <XCircle className="w-4 h-4 text-danger" />
    return <Clock className="w-4 h-4 text-warning" />
  }

  return (
    <div>
      <button onClick={() => navigate('/students')} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Avatar name={student.name} size="lg" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-ink">{student.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-ink-muted">{student.id}</p>
            <span className="text-ink-muted">•</span>
            <p className="text-sm text-ink-secondary">Class {student.class}</p>
            <StatusBadge status={student.status} />
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Personal Information</h3>
            <div className="space-y-3">
              <InfoRow label="Full Name" value={student.name} />
              <InfoRow label="Student ID" value={student.id} />
              <InfoRow label="Date of Birth" value={formatDate(student.dob)} />
              <InfoRow label="Admission Date" value={formatDate(student.admissionDate)} />
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Guardian Information</h3>
            <div className="space-y-3">
              <InfoRow label="Guardian Name" value={student.guardian} />
              <InfoRow label="Phone" value={student.phone} />
              <InfoRow label="Email" value={student.email || '—'} />
            </div>
          </Card>
          <Card className="sm:col-span-2">
            <h3 className="text-base font-semibold text-ink mb-4">Academic Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-btn bg-surface-app text-center">
                <p className="text-2xl font-semibold text-ink">87%</p>
                <p className="text-xs text-ink-secondary mt-1">Average Grade</p>
              </div>
              <div className="p-3 rounded-btn bg-surface-app text-center">
                <p className="text-2xl font-semibold text-ink">92%</p>
                <p className="text-xs text-ink-secondary mt-1">Attendance</p>
              </div>
              <div className="p-3 rounded-btn bg-surface-app text-center">
                <p className="text-2xl font-semibold text-ink">94%</p>
                <p className="text-xs text-ink-secondary mt-1">Homework</p>
              </div>
              <div className="p-3 rounded-btn bg-surface-app text-center">
                <p className="text-2xl font-semibold text-success">89%</p>
                <p className="text-xs text-ink-secondary mt-1">Overall Progress</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><div><p className="text-sm text-ink-secondary">Average Grade</p><p className="text-2xl font-semibold text-ink mt-1">87%</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Attendance</p><p className="text-2xl font-semibold text-ink mt-1">92%</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Homework</p><p className="text-2xl font-semibold text-ink mt-1">94%</p></div></Card>
          <Card><div><p className="text-sm text-ink-secondary">Overall Progress</p><p className="text-2xl font-semibold text-success mt-1">89%</p></div></Card>
        </div>
      )}

      {activeTab === 'grades' && (
        <Card padding={false}>
          <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Academic Results — Midterm 2026</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Subject</th>
                  <th className="table-header">Marks</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody>
                {mockResults.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="table-cell font-medium">{r.subject}</td>
                    <td className="table-cell">{r.marks}</td>
                    <td className="table-cell text-ink-secondary">{r.total}</td>
                    <td className="table-cell"><span className={cn('font-semibold', gradeColor(r.grade))}>{r.grade}</span></td>
                  </tr>
                ))}
                <tr className="bg-surface-app">
                  <td className="table-cell font-semibold">Total</td>
                  <td className="table-cell font-semibold">{mockResults.reduce((s, r) => s + r.marks, 0)}</td>
                  <td className="table-cell font-semibold">700</td>
                  <td className="table-cell font-semibold text-primary">A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'August Monthly Exam', subject: 'Mathematics', date: '2026-08-25', marks: 91, total: 100, grade: 'A', status: 'Completed' },
            { name: 'August Monthly Exam', subject: 'Physics', date: '2026-08-27', marks: 85, total: 100, grade: 'A-', status: 'Completed' },
            { name: 'August Monthly Exam', subject: 'English', date: '2026-08-29', marks: 94, total: 100, grade: 'A+', status: 'Completed' },
          ].map((exam, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <StatusBadge status={exam.status} />
              </div>
              <h3 className="text-base font-semibold text-ink">{exam.subject}</h3>
              <p className="text-sm text-ink-secondary mb-3">{exam.name}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between"><span className="text-ink-muted">Date</span><span className="font-medium text-ink">{formatDate(exam.date)}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-muted">Score</span><span className="font-medium text-ink">{exam.marks}/{exam.total}</span></div>
                <div className="flex items-center justify-between"><span className="text-ink-muted">Grade</span><span className={cn('font-semibold', gradeColor(exam.grade))}>{exam.grade}</span></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'homework' && (
        <div className="space-y-3">
          {[
            { title: 'Algebra Worksheet', subject: 'Mathematics', dueDate: '2026-08-25', status: 'Submitted' },
            { title: 'Numerical Problems', subject: 'Physics', dueDate: '2026-08-24', status: 'Pending' },
            { title: 'Programming Exercise', subject: 'Computer Science', dueDate: '2026-08-22', status: 'Graded' },
            { title: 'Essay: My Country', subject: 'English', dueDate: '2026-08-26', status: 'Pending' },
          ].map((hw, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{hw.title}</p>
                  <p className="text-xs text-ink-muted mt-1">{hw.subject} • Due {formatDate(hw.dueDate)}</p>
                </div>
                <StatusBadge status={hw.status === 'Pending' ? 'Pending' : hw.status === 'Submitted' ? 'Sent' : 'Completed'} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><div><p className="text-sm text-ink-secondary">Total Paid</p><p className="text-2xl font-semibold text-success mt-1">{formatPKRFull(totalPaid)}</p></div></Card>
            <Card><div><p className="text-sm text-ink-secondary">Outstanding</p><p className="text-2xl font-semibold text-danger mt-1">{formatPKRFull(outstanding)}</p></div></Card>
            <Card><div><p className="text-sm text-ink-secondary">Fee Status</p><div className="mt-2"><StatusBadge status={student.feeStatus} /></div></div></Card>
          </div>
          <Card padding={false}>
            <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Payment History</h3></div>
            {studentChallans.length === 0 ? (
              <EmptyState title="No fee records" description="No challans found for this student." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="table-header">Challan #</th>
                      <th className="table-header">Month</th>
                      <th className="table-header">Amount</th>
                      <th className="table-header">Due Date</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentChallans.map(c => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover cursor-pointer" onClick={() => navigate(`/challans/${c.id}`)}>
                        <td className="table-cell font-medium">{c.challanNo}</td>
                        <td className="table-cell">{c.month}</td>
                        <td className="table-cell">{formatPKRFull(c.total)}</td>
                        <td className="table-cell text-ink-secondary">{formatDate(c.dueDate)}</td>
                        <td className="table-cell"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-secondary">Attendance Rate</p>
                <p className="text-3xl font-semibold text-ink mt-1">92%</p>
              </div>
              <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">92%</span>
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Recent Attendance</h3></div>
            <div className="divide-y divide-border">
              {mockAttendance.map((rec, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-ink">{formatDate(rec.date)}</span>
                  <div className="flex items-center gap-2">
                    {attIcon(rec.status)}
                    <span className="text-sm text-ink-secondary">{rec.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'results' && (
        <Card padding={false}>
          <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Academic Results — Midterm 2026</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Subject</th>
                  <th className="table-header">Marks</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody>
                {mockResults.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="table-cell font-medium">{r.subject}</td>
                    <td className="table-cell">{r.marks}</td>
                    <td className="table-cell text-ink-secondary">{r.total}</td>
                    <td className="table-cell"><span className={cn('font-semibold', gradeColor(r.grade))}>{r.grade}</span></td>
                  </tr>
                ))}
                <tr className="bg-surface-app">
                  <td className="table-cell font-semibold">Total</td>
                  <td className="table-cell font-semibold">{mockResults.reduce((s, r) => s + r.marks, 0)}</td>
                  <td className="table-cell font-semibold">700</td>
                  <td className="table-cell font-semibold text-primary">A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  )
}

function InfoRow({ label, value, valueClass }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className={cn('text-sm font-medium text-ink', valueClass)}>{value}</span>
    </div>
  )
}
