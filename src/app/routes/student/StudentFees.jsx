import { useState, useEffect } from 'react'
import {
  Wallet, FileText, CheckCircle2, Clock, AlertTriangle, CreditCard,
  Download, Printer, ArrowRight, ShieldCheck, HelpCircle,
  Sparkles, CheckCircle, Smartphone, Building2, Copy, Check, Eye
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import StatCard from '../../../components/ui/StatCard'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import Tabs from '../../../components/ui/Tabs'
import Modal from '../../../components/ui/Modal'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../stores/authStore'
import { useSchoolStore } from '../../../stores/schoolStore'
import challanService from '../../../services/challans'
import feeService from '../../../services/fees'
import { formatPKRFull, formatDate, downloadCSV } from '../../../utils/format'
import pdfGenerator from '../../../services/pdfGenerator'

export default function StudentFees() {
  const { user } = useAuthStore()
  const { school } = useSchoolStore()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('current')
  const [challans, setChallans] = useState([])
  const [feeStructures, setFeeStructures] = useState([])
  const [selectedChallan, setSelectedChallan] = useState(null)

  // Modals
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [challanModalOpen, setChallanModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [cardForm, setCardForm] = useState({
    name: user?.name || 'Ahmed Khan',
    number: '',
    expiry: '',
    cvv: '',
  })
  const [walletPhone, setWalletPhone] = useState('03001234567')

  // History filters
  const [historyFilter, setHistoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const studentId = user?.studentId || 'STU-2026-00124'
    Promise.all([
      challanService.getStudentChallans(studentId),
      feeService.getStructures(),
    ]).then(([chData, fsData]) => {
      setChallans(chData || [])
      setFeeStructures(fsData || [])
      setLoading(false)
    }).catch(err => {
      console.error('Error loading student fee data:', err)
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  // Computations
  const pendingChallan = challans.find(c => c.status === 'Pending' || c.status === 'Overdue') || challans[0]
  const totalOutstanding = challans
    .filter(c => c.status === 'Pending' || c.status === 'Overdue')
    .reduce((sum, c) => sum + (c.total || 0), 0)
  
  const totalPaid = challans
    .filter(c => c.status === 'Paid')
    .reduce((sum, c) => sum + (c.total || 0), 0)

  const activeStructure = feeStructures.find(f => f.class === `Class ${user?.class || '8'}`) || feeStructures[2] || {
    class: 'Class 8',
    total: 11500,
    dueDate: 10,
    lateFee: 500,
    items: [
      { name: 'Tuition Fee', amount: 9000 },
      { name: 'Computer Lab Fee', amount: 1200 },
      { name: 'Science Lab Fee', amount: 800 },
      { name: 'Sports & Activities', amount: 500 },
    ]
  }

  // Handle Online Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!pendingChallan) return

    setIsProcessing(true)
    try {
      // Simulate network request & backend audit update
      const res = await challanService.payStudentChallan(pendingChallan.id, {
        amount: pendingChallan.total,
        method: paymentMethod === 'card' ? 'Online (Credit/Debit Card)' :
                paymentMethod === '1link' ? '1Link / 1Bill Online' :
                paymentMethod === 'wallet' ? 'Mobile Wallet' : 'Bank Transfer',
        studentName: user?.name || 'Ahmed Khan',
      })

      // Update state locally
      setChallans(prev =>
        prev.map(c =>
          c.id === pendingChallan.id
            ? {
                ...c,
                status: 'Paid',
                paidDate: res.paidDate,
                paymentMethod: res.method,
                transactionId: res.transactionId,
              }
            : c
        )
      )

      setPaymentSuccess(res)
      toast.success('Fee payment completed successfully!')
    } catch (err) {
      toast.error('Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenReceipt = (challan) => {
    setActiveReceipt(challan)
    setReceiptModalOpen(true)
  }

  const handleOpenChallan = (challan) => {
    setSelectedChallan(challan)
    setChallanModalOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportStatement = () => {
    const rows = challans.map(c => ({
      'Challan No': c.challanNo,
      'Billing Month': c.month,
      'Issue Date': c.issueDate,
      'Due Date': c.dueDate,
      'Base Amount (PKR)': c.amount,
      'Discount (PKR)': c.discount,
      'Total Amount (PKR)': c.total,
      'Status': c.status,
      'Paid Date': c.paidDate || 'N/A',
      'Payment Method': c.paymentMethod || 'N/A',
      'Transaction ID': c.transactionId || 'N/A',
    }))
    downloadCSV(`Fee_Statement_${user?.studentId || 'Student'}_2026.csv`, rows)
    toast.success('Fee statement downloaded successfully')
  }

  const copyPSID = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.success('1Bill PSID copied to clipboard')
    setTimeout(() => setCopiedCode(false), 2500)
  }

  // Filtered History
  const filteredChallans = challans.filter(c => {
    const matchesFilter = historyFilter === 'all' || c.status.toLowerCase() === historyFilter.toLowerCase()
    const matchesSearch =
      c.challanNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.transactionId && c.transactionId.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div>
      <PageHeader
        title="Fee & Challans"
        subtitle="View tuition invoices, track payment receipts, and pay online securely"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExportStatement}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Statement</span>
            </Button>
            {pendingChallan?.status !== 'Paid' && (
              <Button onClick={() => { setPaymentSuccess(null); setPayModalOpen(true) }}>
                <CreditCard className="w-4 h-4" />
                <span>Pay Fee</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Outstanding Dues"
          value={formatPKRFull(totalOutstanding)}
          icon={Wallet}
          subtext={totalOutstanding > 0 ? `Due by ${formatDate(pendingChallan?.dueDate)}` : 'All cleared'}
        />
        <StatCard
          label="Total Paid (2026)"
          value={formatPKRFull(totalPaid)}
          icon={CheckCircle2}
          subtext="Academic Year 2026"
        />
        <StatCard
          label="Fee Status"
          value={totalOutstanding === 0 ? 'Fully Paid' : pendingChallan?.status || 'Pending'}
          icon={Clock}
          subtext={totalOutstanding === 0 ? 'No pending invoices' : 'Monthly challan pending'}
        />
        <StatCard
          label="Class Fee Tier"
          value={`Class ${user?.class || '8'}-${user?.section || 'B'}`}
          icon={FileText}
          subtext={`${formatPKRFull(activeStructure.total)} / month`}
        />
      </div>

      {/* Main Tabs */}
      <Tabs
        tabs={[
          { id: 'current', label: 'Current Challan & Pay' },
          { id: 'history', label: `Challan History (${challans.length})` },
          { id: 'structure', label: 'Class Fee Structure' },
          { id: 'guidelines', label: 'Payment Guidelines' },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="mb-6"
      />

      {/* TAB 1: Current Challan & Pay */}
      {tab === 'current' && (
        <div className="space-y-6">
          {pendingChallan ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Bill Card */}
              <Card className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-ink">
                        Challan {pendingChallan.challanNo}
                      </h3>
                      <StatusBadge status={pendingChallan.status} />
                    </div>
                    <p className="text-xs text-ink-muted">
                      Billing Period: <strong className="text-ink">{pendingChallan.month}</strong> • Issued: {formatDate(pendingChallan.issueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenChallan(pendingChallan)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Challan</span>
                    </Button>
                    {pendingChallan.status === 'Paid' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReceipt(pendingChallan)}
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Receipt</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => { setPaymentSuccess(null); setPayModalOpen(true) }}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Online</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Itemized Breakdown Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-app text-xs uppercase text-ink-muted">
                        <th className="py-2.5 px-3 text-left font-medium">Fee Head</th>
                        <th className="py-2.5 px-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(pendingChallan.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-hover/50">
                          <td className="py-2.5 px-3 font-medium text-ink">{item.name}</td>
                          <td className="py-2.5 px-3 text-right text-ink font-semibold">{formatPKRFull(item.amount)}</td>
                        </tr>
                      ))}
                      {pendingChallan.discount > 0 && (
                        <tr className="text-success bg-success-bg/30">
                          <td className="py-2.5 px-3 font-medium">Scholarship / Sibling Concession</td>
                          <td className="py-2.5 px-3 text-right font-semibold">- {formatPKRFull(pendingChallan.discount)}</td>
                        </tr>
                      )}
                      {pendingChallan.previousBalance > 0 && (
                        <tr className="text-danger bg-danger-bg/30">
                          <td className="py-2.5 px-3 font-medium">Arrears / Previous Balance</td>
                          <td className="py-2.5 px-3 text-right font-semibold">+ {formatPKRFull(pendingChallan.previousBalance)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-bold text-ink">
                        <td className="py-3 px-3 text-base">Net Payable Amount</td>
                        <td className="py-3 px-3 text-right text-lg text-primary">{formatPKRFull(pendingChallan.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Due Date Notice & Instructions */}
                <div className={pendingChallan.status === 'Paid' ? 'p-3.5 bg-success-bg/50 border border-success/30 rounded-btn flex items-start gap-3' : 'p-3.5 bg-warning-bg/50 border border-warning/30 rounded-btn flex items-start gap-3'}>
                  {pendingChallan.status === 'Paid' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-ink">Paid on {formatDate(pendingChallan.paidDate)}</p>
                        <p className="text-xs text-ink-secondary">
                          Transaction code: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">{pendingChallan.transactionId || 'TXN-ONLINE'}</code> via {pendingChallan.paymentMethod || 'Online'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          Due Date: {formatDate(pendingChallan.dueDate)}
                        </p>
                        <p className="text-xs text-ink-secondary">
                          Please clear your dues on or before the due date. A late surcharge of {formatPKRFull(pendingChallan.lateFee || 500)} will apply automatically after {formatDate(pendingChallan.dueDate)}.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Quick Pay / Payment Methods Box */}
              <div className="space-y-4">
                <Card>
                  <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Quick Online Payment
                  </h3>
                  <p className="text-xs text-ink-muted mb-4">
                    Pay securely using your Debit/Credit card, 1Link 1Bill PSID, or Mobile Wallet.
                  </p>

                  <div className="p-3 bg-surface-app border border-border rounded-btn mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink-secondary">
                      <span>Student ID</span>
                      <span className="font-semibold text-ink">{user?.studentId || 'STU-2026-00124'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-secondary">
                      <span>Student Name</span>
                      <span className="font-semibold text-ink">{user?.name || 'Ahmed Khan'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-ink-secondary">
                      <span>1Bill Invoice PSID</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono text-xs font-semibold text-ink bg-white px-1.5 py-0.5 rounded border border-border">
                          100842{pendingChallan.challanNo.replace(/[^0-9]/g, '')}
                        </code>
                        <button
                          onClick={() => copyPSID(`100842${pendingChallan.challanNo.replace(/[^0-9]/g, '')}`)}
                          className="p-1 text-ink-muted hover:text-ink"
                          title="Copy PSID"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {pendingChallan.status === 'Paid' ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleOpenReceipt(pendingChallan)}
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Payment Receipt</span>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => { setPaymentSuccess(null); setPayModalOpen(true) }}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {formatPKRFull(pendingChallan.total)} Now</span>
                    </Button>
                  )}
                </Card>

                <Card>
                  <h4 className="text-sm font-semibold text-ink mb-2">Need Support?</h4>
                  <p className="text-xs text-ink-muted mb-3">
                    If you notice any discrepancies in your fee voucher or have applied for financial assistance, please contact the Accounts Office.
                  </p>
                  <div className="text-xs space-y-1 text-ink-secondary">
                    <p>📞 Phone: <strong>+92 21 3456 7890</strong></p>
                    <p>✉️ Email: <strong>accounts@{school.name.toLowerCase().replace(/\s+/g, '')}.edu.pk</strong></p>
                    <p>⏰ Timing: Mon - Fri, 8:00 AM - 2:00 PM</p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-ink mb-1">All Dues Cleared</h3>
              <p className="text-sm text-ink-muted">You do not have any pending fee challans at this moment.</p>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Challan History & Receipts */}
      {tab === 'history' && (
        <Card padding={false}>
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Challan # or Month..."
                className="input max-w-xs text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              {['all', 'paid', 'pending', 'overdue'].map(st => (
                <button
                  key={st}
                  onClick={() => setHistoryFilter(st)}
                  className={`px-3 py-1 text-xs font-medium rounded-btn capitalize transition-colors ${
                    historyFilter === st
                      ? 'bg-primary text-white'
                      : 'bg-surface-app text-ink-secondary hover:bg-surface-hover hover:text-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-app text-xs uppercase text-ink-muted">
                  <th className="table-header">Challan No</th>
                  <th className="table-header">Billing Month</th>
                  <th className="table-header">Issue Date</th>
                  <th className="table-header">Due Date</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Paid Date & Mode</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-ink-muted">
                      No fee records matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map(ch => (
                    <tr key={ch.id} className="hover:bg-surface-hover/60 transition-colors">
                      <td className="table-cell font-mono font-medium text-ink">{ch.challanNo}</td>
                      <td className="table-cell font-medium text-ink">{ch.month}</td>
                      <td className="table-cell text-ink-muted text-xs">{formatDate(ch.issueDate)}</td>
                      <td className="table-cell text-ink-muted text-xs">{formatDate(ch.dueDate)}</td>
                      <td className="table-cell font-semibold text-ink">{formatPKRFull(ch.total)}</td>
                      <td className="table-cell">
                        <StatusBadge status={ch.status} />
                      </td>
                      <td className="table-cell text-xs text-ink-secondary">
                        {ch.paidDate ? (
                          <div>
                            <p className="font-medium text-ink">{formatDate(ch.paidDate)}</p>
                            <p className="text-ink-muted text-[11px]">{ch.paymentMethod || 'Online'}</p>
                          </div>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenChallan(ch)}
                            className="p-1.5 rounded-btn text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors"
                            title="View Challan Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {ch.status === 'Paid' ? (
                            <button
                              onClick={() => handleOpenReceipt(ch)}
                              className="p-1.5 rounded-btn text-primary hover:bg-primary-light transition-colors"
                              title="Download Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedChallan(ch)
                                setPaymentSuccess(null)
                                setPayModalOpen(true)
                              }}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Class Fee Structure */}
      {tab === 'structure' && (
        <div className="space-y-6">
          <Card padding={false}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {activeStructure.class} Monthly Fee Breakdown
                </h3>
                <p className="text-xs text-ink-muted">
                  Official fee schedule approved for Academic Session 2026-2027
                </p>
              </div>
              <span className="text-base font-bold text-primary">
                {formatPKRFull(activeStructure.total)} / month
              </span>
            </div>

            <div className="divide-y divide-border">
              {(activeStructure.items || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-hover/50">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.name.includes('Tuition')
                        ? 'Core instructional and academic curriculum fee'
                        : item.name.includes('Computer')
                        ? 'High-speed internet, IT lab infrastructure and software licenses'
                        : item.name.includes('Science')
                        ? 'Laboratory consumables, chemistry & physics apparatus'
                        : 'Extracurricular clubs, sports coaching, and library access'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatPKRFull(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-surface-app border-t border-border flex items-center justify-between text-xs text-ink-secondary">
              <span>Standard Due Date: <strong>{activeStructure.dueDate || 10}th of every month</strong></span>
              <span>Late Fee Surcharge: <strong>{formatPKRFull(activeStructure.lateFee || 500)}</strong></span>
            </div>
          </Card>

          {/* All Classes Overview */}
          <div>
            <h4 className="text-sm font-semibold text-ink mb-3">All Classes Comparison</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeStructures.map(fs => (
                <Card key={fs.id} className={fs.class === `Class ${user?.class || '8'}` ? 'border-2 border-primary bg-primary-50/20' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-ink">{fs.class}</h5>
                    <span className="text-sm font-bold text-primary">{formatPKRFull(fs.total)}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-ink-secondary mb-3">
                    {(fs.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.name}</span>
                        <span>{formatPKRFull(it.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-[11px] text-ink-muted">
                    <span>Due: {fs.dueDate || 10}th</span>
                    <span>Late: {formatPKRFull(fs.lateFee || 500)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Payment Guidelines & Bank Accounts */}
      {tab === 'guidelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Designated Bank Accounts
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              You can deposit tuition fees at any of the following affiliated bank branches nationwide:
            </p>

            <div className="space-y-3">
              <div className="p-3.5 bg-surface-app border border-border rounded-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-ink text-sm">Habib Bank Limited (HBL)</span>
                  <span className="badge bg-success-bg text-success text-[11px]">Primary Bank</span>
                </div>
                <div className="text-xs space-y-1 text-ink-secondary">
                  <p>Account Title: <strong>{school.name} Education Trust</strong></p>
                  <p>Account Number: <strong className="font-mono text-ink">0123-45678901-03</strong></p>
                  <p>IBAN: <strong className="font-mono text-ink">PK36 HABB 0001 2345 6789 0103</strong></p>
                  <p>Branch: Main Boulevard Branch (Code: 0123)</p>
                </div>
              </div>

              <div className="p-3.5 bg-surface-app border border-border rounded-card">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-ink text-sm">Meezan Islamic Bank</span>
                  <span className="badge bg-info-bg text-info text-[11px]">Islamic Banking</span>
                </div>
                <div className="text-xs space-y-1 text-ink-secondary">
                  <p>Account Title: <strong>{school.name} School System</strong></p>
                  <p>Account Number: <strong className="font-mono text-ink">0987-65432109-01</strong></p>
                  <p>IBAN: <strong className="font-mono text-ink">PK89 MEZN 0009 8765 4321 0901</strong></p>
                  <p>Branch: Civic Centre Branch (Code: 0987)</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-ink mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              1Link 1Bill & Mobile App Instructions
            </h3>

            <div className="space-y-4 text-xs text-ink-secondary">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">1</div>
                <div>
                  <p className="font-semibold text-ink text-sm">Open Any Banking or Wallet App</p>
                  <p className="text-ink-muted">Login to HBL, Meezan, Alfalah, EasyPaisa, JazzCash, Nayapay, or Sadapay.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">2</div>
                <div>
                  <p className="font-semibold text-ink text-sm">Select '1Bill Invoices / Fees'</p>
                  <p className="text-ink-muted">Navigate to Bill Payments → 1Bill Invoice / Voucher option.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">3</div>
                <div>
                  <p className="font-semibold text-ink text-sm">Enter the 18-digit Voucher ID</p>
                  <p className="text-ink-muted">
                    Your consumer prefix is <code>100842</code> followed by your challan reference number.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">4</div>
                <div>
                  <p className="font-semibold text-ink text-sm">Confirm & Save Receipt</p>
                  <p className="text-ink-muted">The student fee portal will automatically reconcile your payment within 10 minutes.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 p-3 bg-surface-app border border-border rounded-btn text-xs text-ink">
              <p className="font-semibold mb-1">Important Note on Cash Payments:</p>
              <p className="text-ink-muted">
                If depositing cash at bank counter, please ensure you retain the signed 'Student Copy' of the fee challan with the bank teller's official stamp.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ONLINE PAYMENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={paymentSuccess ? 'Payment Successful' : 'Secure Fee Checkout'}
        size="lg"
      >
        {paymentSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mx-auto mb-4 animate-[scaleUp_0.3s_ease-out]">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-1">Fee Payment Completed!</h3>
            <p className="text-sm text-ink-muted mb-6">
              Thank you. Your tuition payment has been verified and processed securely.
            </p>

            <div className="max-w-md mx-auto p-4 bg-surface-app border border-border rounded-card text-left space-y-2 mb-6 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Transaction ID:</span>
                <span className="font-mono font-bold text-ink">{paymentSuccess.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Challan Ref:</span>
                <span className="font-semibold text-ink">{paymentSuccess.challanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Amount Paid:</span>
                <span className="font-bold text-primary text-sm">{formatPKRFull(paymentSuccess.amount || pendingChallan?.total || 11500)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Payment Method:</span>
                <span className="font-medium text-ink">{paymentSuccess.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Payment Date:</span>
                <span className="font-medium text-ink">{formatDate(paymentSuccess.paidDate)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setPayModalOpen(false)
                  handleOpenReceipt(pendingChallan)
                }}
              >
                <Printer className="w-4 h-4" />
                <span>View Receipt</span>
              </Button>
              <Button onClick={() => setPayModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Amount Summary Header */}
            <div className="p-4 bg-surface-app border border-border rounded-btn flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-muted">Paying Fee For</p>
                <p className="text-sm font-semibold text-ink">
                  {user?.name || 'Ahmed Khan'} • {pendingChallan?.month || 'August 2026'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">Total Payable</p>
                <p className="text-lg font-bold text-primary">
                  {formatPKRFull(pendingChallan?.total || 11500)}
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="label">Select Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                  { id: '1link', label: '1Link / 1Bill', icon: Building2 },
                  { id: 'wallet', label: 'Mobile Wallet', icon: Smartphone },
                  { id: 'bank', label: 'Bank Transfer', icon: ShieldCheck },
                ].map(m => {
                  const Icon = m.icon
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-btn border text-left flex flex-col gap-1.5 transition-all ${
                        paymentMethod === m.id
                          ? 'border-primary bg-primary-light/40 text-primary shadow-sm ring-1 ring-primary'
                          : 'border-border bg-white text-ink hover:bg-surface-hover'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold leading-tight">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sub-form based on method */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 p-4 border border-border rounded-btn bg-surface-app/40">
                <div>
                  <label className="label text-xs">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardForm.name}
                    onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                    placeholder="e.g. Imran Khan"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-xs">Card Number (Visa / Mastercard / UnionPay)</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardForm.number}
                    onChange={e => setCardForm({ ...cardForm, number: e.target.value })}
                    placeholder="4111 2222 3333 4444"
                    className="input text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Expiry Date (MM/YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardForm.expiry}
                      onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })}
                      placeholder="08/28"
                      className="input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">CVV / Security Code</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardForm.cvv}
                      onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })}
                      placeholder="•••"
                      className="input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === '1link' && (
              <div className="p-4 border border-border rounded-btn bg-surface-app space-y-3 text-xs">
                <p className="text-ink-secondary">
                  Use the following 1Bill Invoice Code to pay via your bank's mobile app or ATM:
                </p>
                <div className="flex items-center justify-between p-3 bg-white border border-border rounded-btn">
                  <div>
                    <p className="text-[10px] uppercase text-ink-muted font-bold">1Bill Invoice Consumer Number</p>
                    <p className="font-mono text-base font-bold text-ink">
                      100842{pendingChallan?.challanNo.replace(/[^0-9]/g, '') || '202608001'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => copyPSID(`100842${pendingChallan?.challanNo.replace(/[^0-9]/g, '') || '202608001'}`)}
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    <span>Copy</span>
                  </Button>
                </div>
                <p className="text-ink-muted">
                  Click 'Confirm Payment' once you have transferred the funds.
                </p>
              </div>
            )}

            {paymentMethod === 'wallet' && (
              <div className="p-4 border border-border rounded-btn bg-surface-app space-y-3">
                <div>
                  <label className="label text-xs">Mobile Wallet Account Number (EasyPaisa / JazzCash / Nayapay)</label>
                  <input
                    type="tel"
                    required
                    value={walletPhone}
                    onChange={e => setWalletPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="input text-xs font-mono"
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  An OTP payment approval prompt will be sent directly to your registered mobile wallet app.
                </p>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="p-4 border border-border rounded-btn bg-surface-app space-y-3 text-xs text-ink-secondary">
                <p>Transfer {formatPKRFull(pendingChallan?.total || 11500)} to HBL Account <strong>0123-45678901-03</strong>.</p>
                <div>
                  <label className="label text-xs">Bank Transfer Reference / Transaction ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HBL-FT-981249"
                    className="input text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>256-Bit SSL Encrypted & PCI-DSS Compliant Payment Gateway</span>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Processing Transaction...' : `Pay ${formatPKRFull(pendingChallan?.total || 11500)}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL 3-PART PRINTABLE BANK CHALLAN MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={challanModalOpen}
        onClose={() => setChallanModalOpen(false)}
        title={`Fee Challan: ${selectedChallan?.challanNo || 'Voucher'}`}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-ink-muted">Valid for payment at all authorized bank branches</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setChallanModalOpen(false)}>Close</Button>
              <Button variant="secondary" onClick={() => {
                try {
                  pdfGenerator.generateChallan(selectedChallan, school)
                  toast.success('Challan PDF downloaded')
                } catch {
                  toast.error('Failed to generate PDF')
                }
              }}>
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="w-4 h-4" />
                <span>Print Challan</span>
              </Button>
            </div>
          </div>
        }
      >
        {selectedChallan && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['BANK COPY', 'SCHOOL COPY', 'STUDENT COPY'].map((copyType, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed border-border p-4 rounded-card bg-white text-xs flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="text-center pb-2 mb-2 border-b border-border">
                      <p className="font-bold text-ink text-sm">{school.name || 'LearnNova School'}</p>
                      <p className="text-[10px] text-ink-muted">Campus 1, Main Boulevard</p>
                      <span className="inline-block mt-1 font-bold text-[10px] px-2 py-0.5 bg-ink text-white rounded">
                        {copyType}
                      </span>
                    </div>

                    {/* Meta details */}
                    <div className="space-y-1 mb-3 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Challan No:</span>
                        <span className="font-mono font-bold text-ink">{selectedChallan.challanNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Billing Month:</span>
                        <span className="font-semibold text-ink">{selectedChallan.month}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Student ID:</span>
                        <span className="font-bold text-ink">{selectedChallan.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Name:</span>
                        <span className="font-semibold text-ink">{selectedChallan.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Class:</span>
                        <span className="text-ink">{selectedChallan.class}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Issue Date:</span>
                        <span className="text-ink">{formatDate(selectedChallan.issueDate)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-danger">
                        <span>Due Date:</span>
                        <span>{formatDate(selectedChallan.dueDate)}</span>
                      </div>
                    </div>

                    {/* Particulars Table */}
                    <div className="border border-border rounded mb-3 overflow-hidden text-[11px]">
                      <div className="bg-surface-app p-1 font-semibold flex justify-between border-b border-border">
                        <span>Particulars</span>
                        <span>Amount</span>
                      </div>
                      <div className="divide-y divide-border p-1 space-y-0.5">
                        {(selectedChallan.items || []).map((it, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-ink-secondary">{it.name}</span>
                            <span className="font-medium text-ink">{it.amount}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-surface-app p-1.5 font-bold flex justify-between border-t border-border text-primary">
                        <span>Total (PKR):</span>
                        <span>{formatPKRFull(selectedChallan.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stamp & Signature area */}
                  <div className="pt-4 border-t border-border text-[10px] space-y-3">
                    <p className="text-ink-muted">HBL A/C # 0123-45678901-03</p>
                    <div className="flex justify-between pt-4 text-ink-muted">
                      <span>Cashier Stamp</span>
                      <span>Authorized Sign</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 3. OFFICIAL PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Electronic Payment Receipt"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setReceiptModalOpen(false)}>Close</Button>
            <Button variant="secondary" onClick={() => {
              try {
                pdfGenerator.generateReceipt(activeReceipt, school)
                toast.success('Payment receipt PDF downloaded')
              } catch {
                toast.error('Failed to generate PDF')
              }
            }}>
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </Button>
          </div>
        }
      >
        {activeReceipt && (
          <div className="p-4 border border-border rounded-card bg-surface-app/30 space-y-4 text-xs">
            {/* Header */}
            <div className="text-center pb-3 border-b border-border">
              <h3 className="text-base font-bold text-ink">{school.name}</h3>
              <p className="text-ink-muted text-[11px]">Fee Collection & Accounts Department</p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-success-bg text-success rounded-full font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                PAYMENT CONFIRMED
              </div>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-ink-muted text-[11px]">Transaction ID</span>
                <p className="font-mono font-bold text-ink">{activeReceipt.transactionId || 'TXN-2026-ONLINE'}</p>
              </div>
              <div>
                <span className="text-ink-muted text-[11px]">Challan Reference</span>
                <p className="font-semibold text-ink">{activeReceipt.challanNo}</p>
              </div>
              <div>
                <span className="text-ink-muted text-[11px]">Student Name</span>
                <p className="font-semibold text-ink">{activeReceipt.studentName}</p>
              </div>
              <div>
                <span className="text-ink-muted text-[11px]">Student ID</span>
                <p className="font-semibold text-ink">{activeReceipt.studentId}</p>
              </div>
              <div>
                <span className="text-ink-muted text-[11px]">Class & Section</span>
                <p className="font-semibold text-ink">{activeReceipt.class}</p>
              </div>
              <div>
                <span className="text-ink-muted text-[11px]">Payment Date</span>
                <p className="font-semibold text-ink">{formatDate(activeReceipt.paidDate || new Date())}</p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="p-3 bg-white border border-border rounded-btn space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Billing Month:</span>
                <span className="font-semibold text-ink">{activeReceipt.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Payment Method:</span>
                <span className="font-semibold text-ink">{activeReceipt.paymentMethod || 'Online'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-primary">
                <span>Total Amount Paid:</span>
                <span>{formatPKRFull(activeReceipt.total)}</span>
              </div>
            </div>

            <p className="text-[11px] text-ink-muted text-center italic">
              This is a system-generated electronic receipt and does not require a physical signature.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
