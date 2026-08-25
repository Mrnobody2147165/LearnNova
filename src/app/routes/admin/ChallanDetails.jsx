import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Printer, Send, GraduationCap, MessageSquare, Edit2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { useSchoolStore } from '../../../stores/schoolStore'
import challanService from '../../../services/challans'
import pdfGenerator from '../../../services/pdfGenerator'
import whatsappService from '../../../services/whatsapp'
import { formatPKRFull, formatDate } from '../../../utils/format'

export default function ChallanDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { school } = useSchoolStore()
  const [challan, setChallan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    challanService.getById(id).then(data => {
      setChallan(data)
      setPhone(data?.studentPhone || '03001234567')
      setLoading(false)
    }).catch(err => {
      console.error('Error loading challan:', err)
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingState />
  if (!challan) return <EmptyState title="Challan not found" description="The challan you're looking for doesn't exist." action={<Button onClick={() => navigate('/challans')}>Back to Challans</Button>} />

  const subtotal = (challan.feeBreakdown || []).reduce((sum, item) => sum + (item.amount || 0), 0)

  const handleDownloadPDF = () => {
    try {
      pdfGenerator.generateChallan(challan, school)
      toast.success('Challan PDF downloaded successfully.')
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Failed to generate PDF')
    }
  }

  const handleDispatchWhatsApp = async () => {
    try {
      await whatsappService.sendChallanWhatsApp(challan, phone, school.name)
      setChallan(prev => ({ ...prev, studentPhone: phone }))
      setWhatsappModalOpen(false)
      toast.success('WhatsApp dispatched with formatted Challan voucher notice!')
    } catch (err) {
      toast.error('Failed to dispatch WhatsApp message')
    }
  }

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
          <Button variant="secondary" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button onClick={() => setWhatsappModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <MessageSquare className="w-4 h-4 mr-1.5" /> Send WhatsApp
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
            <p className="text-xs text-ink-muted font-mono font-bold">Challan #{challan.challanNo}</p>
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
            <p className="text-xs text-ink-muted mb-1">Parent WhatsApp</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-ink">{challan.studentPhone || 'Not Set'}</span>
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(true)}
                className="text-xs text-primary hover:underline flex items-center gap-0.5"
              >
                <Edit2 className="w-3 h-3" /> Change
              </button>
            </div>
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
            {(challan.feeBreakdown || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink-secondary">{item.head || item.name}</span>
                <span className="font-medium text-ink">{formatPKRFull(item.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 border-t border-border font-medium">
              <span className="text-ink">Subtotal</span>
              <span className="text-ink">{formatPKRFull(subtotal)}</span>
            </div>
            {challan.discount > 0 && (
              <div className="flex justify-between text-sm text-success font-medium">
                <span>Scholarship / Discount Applied</span>
                <span>-{formatPKRFull(challan.discount)}</span>
              </div>
            )}
            {challan.previousBalance > 0 && (
              <div className="flex justify-between text-sm text-danger font-medium">
                <span>Previous Arrears</span>
                <span>+{formatPKRFull(challan.previousBalance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 flex justify-between items-baseline">
          <div>
            <p className="text-lg font-bold text-ink">Total Payable</p>
            <p className="text-xs text-ink-muted">Due by {formatDate(challan.dueDate)}</p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatPKRFull(challan.total)}</p>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-btn bg-surface-app text-xs text-ink-secondary space-y-1">
          <p className="font-medium text-ink">Payment Instructions:</p>
          <p>1. Pay online via the student portal using credit card, debit card, or 1Link banking.</p>
          <p>2. Or deposit cash at any designated bank branch using Challan #{challan.challanNo}.</p>
          <p>3. Late fee of PKR 500 will apply after {formatDate(challan.dueDate)}.</p>
        </div>
      </Card>

      {/* WhatsApp Verification & Send Modal */}
      <Modal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        title="Verify WhatsApp & Send Challan"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setWhatsappModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDispatchWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="w-4 h-4 mr-1.5" />
              Dispatch via WhatsApp
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-card border border-emerald-200 text-xs text-emerald-900">
            You can verify or update the parent's WhatsApp number below. Updating it will permanently link the new number with this student.
          </div>

          <Input
            label="Parent / Recipient WhatsApp Number *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03001234567 or +923001234567"
          />

          <div>
            <p className="text-xs font-semibold text-ink mb-1.5">Formatted WhatsApp Message:</p>
            <div className="p-3 rounded-card bg-surface-app border border-border font-mono text-[11px] whitespace-pre-wrap text-ink-secondary max-h-48 overflow-y-auto">
              {whatsappService.generateChallanMessage(challan, school.name)}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
