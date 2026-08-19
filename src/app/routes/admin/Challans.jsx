import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Download, Send, Eye, FileText, XCircle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import SearchInput from '../../../components/ui/SearchInput'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import challanService from '../../../services/challans'
import { formatPKRFull, formatDate, downloadCSV } from '../../../utils/format'
import { FileText as FileTextIcon, Send as SendIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function Challans() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [challans, setChallans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [genMonth, setGenMonth] = useState('August 2026')
  const [genClass, setGenClass] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [reminderOpen, setReminderOpen] = useState(false)

  useEffect(() => {
    Promise.all([challanService.getAll(), challanService.getStats()]).then(([data, st]) => {
      setChallans(data)
      setStats(st)
      setLoading(false)
    })
  }, [])

  const filtered = challans.filter(c => {
    const matchSearch = !search || c.studentName.toLowerCase().includes(search.toLowerCase()) || c.challanNo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleGenerate = async () => {
    setGenerating(true)
    const newChallans = await challanService.generate(genMonth, genClass === 'all' ? null : genClass)
    setChallans(prev => [...newChallans, ...prev])
    setGenerating(false)
    setGenerateOpen(false)
    toast.success(`${newChallans.length} challans generated for ${genMonth}`)
  }

  const handleSendReminders = async () => {
    const result = await challanService.sendReminders()
    setReminderOpen(false)
    toast.success(`${result.sent} reminders sent to parents`)
  }

  const handleDownloadAll = () => {
    downloadCSV('challans.csv', filtered.map(c => ({ ChallanNo: c.challanNo, Student: c.studentName, Class: c.class, Month: c.month, Amount: c.total, DueDate: c.dueDate, Status: c.status })))
    toast.success('Challans exported to CSV')
  }

  const handleCancel = async (id) => {
    await challanService.cancel(id)
    setChallans(prev => prev.map(c => c.id === id ? { ...c, status: 'Cancelled' } : c))
    toast.success('Challan cancelled')
  }

  return (
    <div>
      <PageHeader
        title="E-Challans"
        subtitle="Generate and manage fee challans"
        actions={
          <>
            <Button variant="secondary" onClick={handleDownloadAll}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="secondary" onClick={() => setReminderOpen(true)}>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send Reminders</span>
            </Button>
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Challans</span>
            </Button>
          </>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard label="Generated" value={stats.generated} icon={FileTextIcon} />
          <StatCard label="Sent" value={stats.sent} icon={SendIcon} />
          <StatCard label="Paid" value={stats.paid} icon={CheckCircle} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4" padding={false}>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by challan # or student..." className="flex-1" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[140px]">
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Sent">Sent</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No challans found" description="Try changing your filters or generate new challans." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Challan #</th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Class</th>
                  <th className="table-header">Month</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="table-cell font-medium">{c.challanNo}</td>
                    <td className="table-cell">{c.studentName}</td>
                    <td className="table-cell">{c.class}</td>
                    <td className="table-cell text-ink-secondary">{c.month}</td>
                    <td className="table-cell font-medium">{formatPKRFull(c.total)}</td>
                    <td className="table-cell text-ink-secondary">{formatDate(c.dueDate)}</td>
                    <td className="table-cell"><StatusBadge status={c.status} /></td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/challans/${c.id}`)} className="p-1.5 rounded-btn text-ink-muted hover:bg-primary-light hover:text-primary transition-colors" aria-label="View challan">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(c.status === 'Pending' || c.status === 'Overdue') && (
                          <button onClick={() => handleCancel(c.id)} className="p-1.5 rounded-btn text-ink-muted hover:bg-danger-bg hover:text-danger transition-colors" aria-label="Cancel challan">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      <Modal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Monthly Challans"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Fee Month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} placeholder="e.g. September 2026" />
          <Select label="Class" value={genClass} onChange={(e) => setGenClass(e.target.value)}>
            <option value="all">All Classes</option>
            {['6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
          </Select>
          <p className="text-sm text-ink-secondary">This will generate challans for all students in the selected class(es) based on their fee structure.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onConfirm={handleSendReminders}
        title="Send Reminders"
        message="This will send fee reminders to all parents with pending or overdue challans via WhatsApp/SMS."
        confirmLabel="Send Reminders"
        danger={false}
      />
    </div>
  )
}
