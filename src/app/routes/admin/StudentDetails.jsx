import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Avatar from '../../../components/ui/Avatar'
import StatusBadge from '../../../components/ui/StatusBadge'
import Tabs from '../../../components/ui/Tabs'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import studentService from '../../../services/students'
import { challans as mockChallans } from '../../../data/challans'
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

const mockDocuments = [
  { id: 'DOC-1', name: 'Admission Form', type: 'PDF', date: '2024-03-15' },
  { id: 'DOC-2', name: 'Birth Certificate', type: 'PDF', date: '2024-03-15' },
  { id: 'DOC-3', name: 'Previous School Result', type: 'PDF', date: '2024-03-15' },
  { id: 'DOC-4', name: 'Transfer Certificate', type: 'PDF', date: '2024-03-15' },
]

export default function StudentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    studentService.getById(id).then(data => {
      setStudent(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingState />
  if (!student) return <EmptyState title="Student not found" description="The student you're looking for doesn't exist." action={<Button onClick={() => navigate('/students')}>Back to Students</Button>} />

  const studentChallans = mockChallans.filter(c => c.studentId === student.id)
  const paidChallans = studentChallans.filter(c => c.status === 'Paid')
  const pendingChallans = studentChallans.filter(c => c.status === 'Pending' || c.status === 'Overdue')
  const outstanding = pendingChallans.reduce((sum, c) => sum + c.total, 0)
  const totalPaid = paidChallans.reduce((sum, c) => sum + c.total, 0)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fees', label: 'Fees' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'results', label: 'Results' },
    { id: 'documents', label: 'Documents' },
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
              <InfoRow label="Date of Birth" value={formatDate(student.dob)} />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Address" value={student.address} />
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
          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Admission Information</h3>
            <div className="space-y-3">
              <InfoRow label="Student ID" value={student.id} />
              <InfoRow label="Admission Date" value={formatDate(student.admissionDate)} />
              <InfoRow label="Class" value={`Class ${student.class}`} />
              <InfoRow label="Section" value={student.section || '—'} />
              <InfoRow label="Roll No" value={student.rollNo || '—'} />
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-ink mb-4">Fee Summary</h3>
            <div className="space-y-3">
              <InfoRow label="Total Paid" value={formatPKRFull(totalPaid)} valueClass="text-success" />
              <InfoRow label="Outstanding" value={formatPKRFull(outstanding)} valueClass={outstanding > 0 ? 'text-danger' : 'text-success'} />
              <InfoRow label="Fee Status" value={<StatusBadge status={student.feeStatus} />} />
            </div>
          </Card>
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

      {activeTab === 'documents' && (
        <Card padding={false}>
          <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Student Documents</h3></div>
          <div className="divide-y divide-border">
            {mockDocuments.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-btn bg-surface-app flex items-center justify-center">
                    <FileText className="w-4 h-4 text-ink-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{doc.name}</p>
                    <p className="text-xs text-ink-muted">{doc.type} • {formatDate(doc.date)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast.info(`Downloading ${doc.name}...`)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
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
