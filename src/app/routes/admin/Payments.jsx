import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, CreditCard, Wallet, Calendar, Clock, XCircle, CheckCircle2, FileText, Check } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import SearchInput from '../../../components/ui/SearchInput'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import Avatar from '../../../components/ui/Avatar'
import Modal from '../../../components/ui/Modal'
import Tabs from '../../../components/ui/Tabs'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import paymentService from '../../../services/payments'
import studentService from '../../../services/students'
import challanService from '../../../services/challans'
import { formatPKR, formatPKRFull, formatDate, downloadCSV } from '../../../utils/format'

export default function Payments() {
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('completed') // 'completed' | 'pending'

  // Record Payment Modal
  const [recordOpen, setRecordOpen] = useState(false)
  const [students, setStudents] = useState([])
  const [challans, setChallans] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    challanId: '',
    amount: '11500',
    method: 'Cash',
    referenceNo: '',
    date: new Date().toISOString().split('T')[0],
  })

  const loadData = async () => {
    try {
      const [data, st, stList, chList] = await Promise.all([
        paymentService.getAll(),
        paymentService.getStats(),
        studentService.getAll(),
        challanService.getAll(),
      ])
      setPayments(data || [])
      setStats(st)
      setStudents(stList || [])
      setChallans(chList || [])
      if (stList && stList.length > 0 && !paymentForm.studentId) {
        setPaymentForm(prev => ({ ...prev, studentId: stList[0].rawId || stList[0].id }))
      }
    } catch (err) {
      console.error('Error loading payments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const unpaidChallans = (challans || []).filter(c => c.status !== 'Paid' && c.status !== 'Cancelled')

  const filteredPayments = (payments || []).filter(p => {
    const sName = String(p?.studentName || '').toLowerCase()
    const tId = String(p?.transactionId || p?.id || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    const matchSearch = !q || sName.includes(q) || tId.includes(q)
    const matchStatus = statusFilter === 'all' || String(p?.status || '').toLowerCase() === statusFilter.toLowerCase()
    const matchMethod = methodFilter === 'all' || String(p?.method || '').toLowerCase() === methodFilter.toLowerCase()
    return matchSearch && matchStatus && matchMethod
  })

  const filteredUnpaid = unpaidChallans.filter(c => {
    const sName = String(c?.studentName || '').toLowerCase()
    const cNo = String(c?.challanNo || c?.id || '').toLowerCase()
    const q = String(search || '').toLowerCase()
    return !q || sName.includes(q) || cNo.includes(q)
  })

  const handleExport = () => {
    downloadCSV('payments.csv', filteredPayments.map(p => ({
      TransactionID: p.transactionId,
      Student: p.studentName,
      Amount: p.amount,
      Date: p.date,
      Method: p.method,
      Status: p.status,
    })))
    toast.success('Payments exported to CSV')
  }

  const handleQuickCollect = (challan) => {
    setPaymentForm({
      studentId: challan.studentId || '',
      challanId: challan.rawId || challan.id || challan.challanNo,
      amount: String(challan.total || challan.amount || 11500),
      method: 'Cash',
      referenceNo: `RCP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
    })
    setRecordOpen(true)
  }

  const handleRecordSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await paymentService.recordPayment({
        studentId: paymentForm.studentId,
        challanId: paymentForm.challanId || null,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNo: paymentForm.referenceNo,
        date: paymentForm.date,
      })
      toast.success('Payment recorded successfully! Database and challans updated.')
      setRecordOpen(false)
      setActiveTab('completed')
      await loadData()
    } catch (err) {
      toast.error('Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Fee Payments & Collection Ledger"
        subtitle="Track recorded payment transactions and collect pending monthly student challans"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Collected" value={formatPKR(stats.totalCollected)} icon={Wallet} />
          <StatCard label="Today's Collection" value={formatPKR(stats.todayCollection)} icon={Calendar} />
          <StatCard label="Pending Challans" value={`${stats.pending} (${formatPKR(stats.pendingAmount)})`} icon={Clock} />
          <StatCard label="Failed Payments" value={stats.failed} icon={XCircle} />
        </div>
      )}

      {/* Primary Tabs */}
      <Tabs
        tabs={[
          { id: 'completed', label: `Completed Transactions (${payments.length})` },
          { id: 'pending', label: `Pending Challans to Collect (${unpaidChallans.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {/* Tab 1: Completed Payments Ledger */}
      {activeTab === 'completed' && (
        <>
          {/* Filters */}
          <Card className="mb-4" padding={false}>
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by transaction ID or student..." className="flex-1" />
              <div className="flex gap-3">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[120px]">
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </Select>
                <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="w-auto min-w-[120px]">
                  <option value="all">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Online">Online</option>
                  <option value="Card">Card</option>
                </Select>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card padding={false}>
            {filteredPayments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No completed payments yet"
                description="When students pay their fee challans online or when cash is deposited, transactions will appear here."
                action={
                  <Button onClick={() => setActiveTab('pending')}>
                    View {unpaidChallans.length} Pending Challans to Collect
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-app">
                      <th className="table-header">Transaction ID</th>
                      <th className="table-header">Student</th>
                      <th className="table-header">Challan Ref</th>
                      <th className="table-header">Amount Paid</th>
                      <th className="table-header">Date</th>
                      <th className="table-header">Method</th>
                      <th className="table-header">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                        <td className="table-cell font-mono text-xs font-semibold text-primary">{p.transactionId}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={p.studentName} size="sm" />
                            <span className="font-medium text-ink">{p.studentName}</span>
                          </div>
                        </td>
                        <td className="table-cell text-xs font-mono text-ink-secondary">{p.challanNo}</td>
                        <td className="table-cell font-semibold text-ink">{formatPKRFull(p.amount)}</td>
                        <td className="table-cell text-sm text-ink-secondary">{formatDate(p.date)}</td>
                        <td className="table-cell text-sm text-ink-secondary">{p.method}</td>
                        <td className="table-cell"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Tab 2: Pending Challans Ready to Collect */}
      {activeTab === 'pending' && (
        <Card padding={false}>
          {filteredUnpaid.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All challans are fully cleared!"
              description="There are no pending or overdue fee challans."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead>
                  <tr className="border-b border-border bg-surface-app">
                    <th className="table-header">Challan #</th>
                    <th className="table-header">Student</th>
                    <th className="table-header">Class</th>
                    <th className="table-header">Month</th>
                    <th className="table-header">Payable Amount</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnpaid.map(c => (
                    <tr key={c.id || c.challanNo} className="border-b border-border last:border-0 hover:bg-surface-hover">
                      <td className="table-cell font-mono text-xs font-semibold text-primary">{c.challanNo || c.id}</td>
                      <td className="table-cell font-medium text-ink">{c.studentName || 'Student'}</td>
                      <td className="table-cell text-sm text-ink-secondary">{c.class || '8-B'}</td>
                      <td className="table-cell text-sm text-ink-secondary">{c.month || 'August 2026'}</td>
                      <td className="table-cell font-bold text-ink">{formatPKRFull(c.total || c.amount || 0)}</td>
                      <td className="table-cell text-sm text-ink-secondary">{formatDate(c.dueDate || '2026-08-30')}</td>
                      <td className="table-cell"><StatusBadge status={c.status || 'Pending'} /></td>
                      <td className="table-cell text-right">
                        <Button
                          size="sm"
                          onClick={() => handleQuickCollect(c)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Record Payment
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Record Payment Modal */}
      <Modal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Record Fee Payment Deposit"
        size="md"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Select Student</label>
            <Select
              value={paymentForm.studentId}
              onChange={(e) => {
                const sId = e.target.value
                const studentChallan = challans.find(c => (c.studentId === sId || c.studentName === sId) && c.status !== 'Paid')
                setPaymentForm(prev => ({
                  ...prev,
                  studentId: sId,
                  challanId: studentChallan ? (studentChallan.rawId || studentChallan.id) : '',
                  amount: studentChallan ? String(studentChallan.total) : prev.amount,
                }))
              }}
            >
              {students.map(s => (
                <option key={s.id} value={s.rawId || s.id}>
                  {s.name} ({s.id}) - {s.class}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1">Fee Challan (Optional)</label>
            <Select
              value={paymentForm.challanId}
              onChange={(e) => {
                const ch = challans.find(c => (c.rawId || c.id || c.challanNo) === e.target.value)
                setPaymentForm(prev => ({
                  ...prev,
                  challanId: e.target.value,
                  amount: ch ? String(ch.total) : prev.amount,
                }))
              }}
            >
              <option value="">-- Standalone / Advance Payment --</option>
              {challans.filter(c => c.status !== 'Paid').map(c => (
                <option key={c.id} value={c.rawId || c.id || c.challanNo}>
                  {c.challanNo} - {c.studentName} ({c.month}) - {formatPKRFull(c.total)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                className="input w-full text-sm"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Payment Method</label>
              <Select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Online">Online / Card</option>
                <option value="JazzCash">JazzCash / EasyPaisa</option>
                <option value="Cheque">Cheque</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Receipt / Slip Ref #</label>
              <input
                type="text"
                placeholder="e.g. SLIP-8821"
                className="input w-full text-sm"
                value={paymentForm.referenceNo}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNo: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1">Payment Date</label>
              <input
                type="date"
                required
                className="input w-full text-sm"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setRecordOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Recording...' : 'Confirm & Save Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
