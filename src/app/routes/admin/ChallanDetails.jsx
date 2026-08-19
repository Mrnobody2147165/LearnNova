import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, Send, GraduationCap, QrCode } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { useSchoolStore } from '../../../stores/schoolStore'
import challanService from '../../../services/challans'
import { formatPKRFull, formatDate } from '../../../utils/format'

export default function ChallanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { school } = useSchoolStore()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    challanService.getById(id).then(data => {
      setChallan(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingState />
  if (!challan) return <EmptyState title="Challan not found" description="The challan you're looking for doesn't exist." action={<Button onClick={() => navigate('/challans')}>Back to Challans</Button>} />

  const subtotal = challan.feeBreakdown.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <button onClick={() => navigate('/challans')} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Challans
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{challan.challanNo}</h1>
          <p className="text-sm text-ink-secondary mt-1">{challan.studentName} • Class {challan.class}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => toast.info('Preparing PDF download...')}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button onClick={() => toast.success('Challan sent to parent via WhatsApp')}>
            <Send className="w-4 h-4" /> Send to Parent
          </Button>
        </div>
      </div>

      {/* Challan Preview */}
      <Card className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{school.name}</h2>
              <p className="text-xs text-ink-muted">{school.address}</p>
              <p className="text-xs text-ink-muted">{school.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2"><StatusBadge status={challan.status} /></div>
            <p className="text-xs text-ink-muted">Challan #{challan.challanNo}</p>
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-border">
          <div>
            <p className="text-xs text-ink-muted mb-1">Student Name</p>
            <p className="text-sm font-medium text-ink">{challan.studentName}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1">Class</p>
            <p className="text-sm font-medium text-ink">Class {challan.class}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1">Fee Month</p>
            <p className="text-sm font-medium text-ink">{challan.month}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1">Issue Date</p>
            <p className="text-sm font-medium text-ink">{formatDate(challan.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted mb-1">Due Date</p>
            <p className="text-sm font-medium text-ink">{formatDate(challan.dueDate)}</p>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-ink mb-3">Fee Breakdown</h3>
          <div className="space-y-2">
            {challan.feeBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-ink-secondary">{item.name}</span>
                <span className="text-ink">{formatPKRFull(item.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm pt-3 mt-3 border-t border-border">
            <span className="font-medium text-ink">Subtotal</span>
            <span className="font-medium text-ink">{formatPKRFull(subtotal)}</span>
          </div>
        </div>

        {/* Adjustments */}
        <div className="py-4 border-b border-border space-y-2">
          {challan.previousBalance > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-secondary">Previous Balance</span>
              <span className="text-ink">{formatPKRFull(challan.previousBalance)}</span>
            </div>
          )}
          {challan.discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-secondary">Discount</span>
              <span className="text-success">-{formatPKRFull(challan.discount)}</span>
            </div>
          )}
          {challan.lateFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-secondary">Late Fee</span>
              <span className="text-danger">+{formatPKRFull(challan.lateFee)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between py-4">
          <span className="text-base font-semibold text-ink">Total Amount</span>
          <span className="text-xl font-semibold text-primary">{formatPKRFull(challan.total)}</span>
        </div>

        {/* Payment Instructions + QR */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-ink mb-2">Payment Instructions</h4>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Please deposit the fee at any branch of HBL or Meezan Bank before the due date. Use the challan number as reference. Online payments can be made via 1Bill or your banking app.
            </p>
            <div className="mt-3 space-y-1 text-xs text-ink-muted">
              <p>Bank: HBL • Account: 0012-3456789-001</p>
              <p>Bank: Meezan Bank • Account: 0198-7654321-001</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 border-2 border-border rounded-card flex items-center justify-center bg-surface-app">
              <QrCode className="w-12 h-12 text-ink-muted" />
            </div>
            <p className="text-xs text-ink-muted">Scan to pay</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
