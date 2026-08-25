import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Download, Send, Eye, FileText, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
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
      setChallans(data || [])
      setStats(st)
      setLoading(false)
    }).catch(err => {
      console.error('Error loading challans:', err)
      setLoading(false)
    })
  }, [])

  const filtered = challans.filter(c => {
    const sName = String(c?.studentName || '').toLowerCase()
    const cNo = String(c?.challanNo || c?.id || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    const matchSearch = !q || sName.includes(q) || cNo.includes(q)
    const matchStatus = statusFilter === 'all' || String(c?.status || '').toLowerCase() === statusFilter.toLowerCase()
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
    downloadCSV('challans.csv', filtered.map(c => ({
      ChallanNo: c.challanNo || c.id,
      Student: c.studentName || 'Student',
      Class: c.class || '8-B',
      Month: c.month || 'August 2026',
      Amount: c.total || c.amount || 0,
      DueDate: c.dueDate || '2026-08-10',
      Status: c.status || 'Pending',
    })))
    toast.success('Challans exported to CSV')
  }

  const handleCancel = async (id) => {
    await challanService.cancel(id)
    setChallans(prev => prev.map(c => (c.id === id || c.challanNo === id) ? { ...c, status: 'Cancelled' } : c))
    toast.success('Challan cancelled')
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="E-Challans"
        subtitle="Generate and manage student fee vouchers"
        actions={
          <div className="flex gap-2">
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
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Generated" value={stats.total || challans.length} icon={FileText} />
          <StatCard label="Paid Invoices" value={stats.paid || 0} icon={CheckCircle} />
          <StatCard label="Pending Invoices" value={stats.pending || 0} icon={Clock} />
          <StatCard label="Overdue Invoices" value={stats.overdue || 0} icon={AlertCircle} />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            placeholder="Search by student name or challan number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-48">
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {/* Challan Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No challans found"
          description="No fee challans match your search or filter criteria."
          action={<Button onClick={() => setGenerateOpen(true)}>Generate Challans</Button>}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-app">
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
                {filtered.map((c) => (
                  <tr
                    key={c.id || c.challanNo}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/challans/${c.id || c.challanNo}`)}
                  >
                    <td className="table-cell font-mono text-xs font-semibold text-primary">{c.challanNo || c.id}</td>
                    <td className="table-cell font-medium text-ink">{c.studentName || 'Student'}</td>
                    <td className="table-cell text-sm text-ink-secondary">{c.class || '8-B'}</td>
                    <td className="table-cell text-sm text-ink-secondary">{c.month || 'August 2026'}</td>
                    <td className="table-cell font-semibold text-ink">{formatPKRFull(c.total || c.amount || 0)}</td>
                    <td className="table-cell text-sm text-ink-secondary">{formatDate(c.dueDate || '2026-08-10')}</td>
                    <td className="table-cell"><StatusBadge status={c.status || 'Pending'} /></td>
                    <td className="table-cell text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/challans/${c.id || c.challanNo}`)}
                          aria-label="View challan"
                        >
                          <Eye className="w-4 h-4 text-ink-secondary" />
                        </Button>
                        {c.status !== 'Paid' && c.status !== 'Cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(c.id || c.challanNo)}
                            aria-label="Cancel challan"
                          >
                            <XCircle className="w-4 h-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Generate Challans Modal */}
      <Modal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Monthly Challans">
        <div className="space-y-4">
          <Select label="Billing Month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
          </Select>
          <Select label="Target Class" value={genClass} onChange={(e) => setGenClass(e.target.value)}>
            <option value="all">All Classes (Full School)</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => (
              <option key={c} value={c}>{`Class ${c}`}</option>
            ))}
          </Select>
          <div className="p-3 bg-surface-app rounded-btn border border-border text-xs text-ink-secondary">
            This will calculate base tuition fees, apply sibling & merit scholarships, and generate printable 3-part bank vouchers.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Invoices'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reminder Confirm Modal */}
      <ConfirmDialog
        isOpen={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onConfirm={handleSendReminders}
        title="Send Fee Reminders"
        message="Are you sure you want to broadcast automated SMS & WhatsApp payment reminders to parents of students with pending or overdue challans?"
        confirmText="Broadcast Reminders"
      />
    </div>
  )
}
