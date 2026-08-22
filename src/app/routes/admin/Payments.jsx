import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, CreditCard } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import SearchInput from '../../../components/ui/SearchInput'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import Avatar from '../../../components/ui/Avatar'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import paymentService from '../../../services/payments'
import { formatPKR, formatPKRFull, formatDate, downloadCSV } from '../../../utils/format'
import { Wallet, Calendar, Clock, XCircle } from 'lucide-react'

export default function Payments() {
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    Promise.all([paymentService.getAll(), paymentService.getStats()]).then(([data, st]) => {
      setPayments(data)
      setStats(st)
      setLoading(false)
    })
  }, [])

  const filtered = payments.filter(p => {
    const matchSearch = !search || p.studentName.toLowerCase().includes(search.toLowerCase()) || p.transactionId.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchMethod = methodFilter === 'all' || p.method === methodFilter
    return matchSearch && matchStatus && matchMethod
  })

  const handleExport = () => {
    downloadCSV('payments.csv', filtered.map(p => ({ TransactionID: p.transactionId, Student: p.studentName, Amount: p.amount, Date: p.date, Method: p.method, Status: p.status })))
    toast.success('Payments exported to CSV')
  }

  const handleVerify = async (id) => {
    await paymentService.verify(id)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'Completed' } : p))
    toast.success('Payment verified successfully')
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Track and manage all payment transactions"
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => toast.info('Payment recording will be available with backend integration')}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Record Payment</span>
            </Button>
          </>
        }
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Collected" value={formatPKR(stats.totalCollected)} icon={Wallet} />
          <StatCard label="Today's Collection" value={formatPKR(stats.todayCollection)} icon={Calendar} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard label="Failed" value={stats.failed} icon={XCircle} />
        </div>
      )}

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
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments found" description="Try changing your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Transaction ID</th>
                  <th className="table-header">Student</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="table-cell font-medium">{p.transactionId}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.studentName} size="sm" />
                        <span className="font-medium">{p.studentName}</span>
                      </div>
                    </td>
                    <td className="table-cell font-medium">{formatPKRFull(p.amount)}</td>
                    <td className="table-cell text-ink-secondary">{formatDate(p.date)}</td>
                    <td className="table-cell text-ink-secondary">{p.method}</td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell text-right">
                      {p.status === 'Pending' && (
                        <Button variant="ghost" size="sm" onClick={() => handleVerify(p.id)}>
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
