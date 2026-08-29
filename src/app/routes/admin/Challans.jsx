import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Download, Eye, FileText, XCircle, CheckCircle, Clock, AlertCircle,
  MessageSquare, Send, Edit2, Check, RefreshCw, Zap, Sparkles, Settings
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Input from '../../../components/ui/Input'
import SearchInput from '../../../components/ui/SearchInput'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import Modal from '../../../components/ui/Modal'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { useSchoolStore } from '../../../stores/schoolStore'
import challanService from '../../../services/challans'
import whatsappService from '../../../services/whatsapp'
import { pdfGenerator } from '../../../services/pdfGenerator'
import billingAutomationService, { getAutoBillingConfig } from '../../../services/billingAutomation'
import { formatPKRFull, formatDate, downloadCSV } from '../../../utils/format'

export default function Challans() {
  const navigate = useNavigate()
  const toast = useToast()
  const { school } = useSchoolStore()
  const [challans, setChallans] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Auto-Billing Configuration
  const [autoConfig, setAutoConfig] = useState(getAutoBillingConfig())

  // Generate Modal
  const [generateOpen, setGenerateOpen] = useState(false)
  const [genMonth, setGenMonth] = useState('August 2026')
  const [genClass, setGenClass] = useState('all')
  const [generating, setGenerating] = useState(false)

  // 1-Click Mass Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const [broadcastQueue, setBroadcastQueue] = useState([])
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastProgress, setBroadcastProgress] = useState({ current: 0, total: 0 })
  const [editingPhoneIdx, setEditingPhoneIdx] = useState(null)
  const [tempPhone, setTempPhone] = useState('')

  // Single WhatsApp Verification Modal
  const [singleVerifyChallan, setSingleVerifyChallan] = useState(null)
  const [verifyPhone, setVerifyPhone] = useState('')

  const loadData = async () => {
    try {
      const [data, st] = await Promise.all([challanService.getAll(), challanService.getStats()])
      setChallans(data || [])
      setStats(st)
      setLoading(false)
    } catch (err) {
      console.error('Error loading challans:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-check background billing scheduler
    billingAutomationService.checkAndRunAutoBilling(school.name).then(res => {
      if (res.ran) {
        toast.success(`Automated Billing Engine: Generated & Dispatched ${res.generatedCount} monthly challans!`)
        loadData()
      }
    })
  }, [])

  const pendingChallans = (challans || []).filter(c => c.status === 'Pending' || c.status === 'Overdue')

  const filtered = (challans || []).filter(c => {
    const sName = String(c?.studentName || '').toLowerCase()
    const cNo = String(c?.challanNo || c?.id || '').toLowerCase()
    const sPhone = String(c?.studentPhone || '').toLowerCase()
    const q = String(search || '').toLowerCase()

    const matchSearch = !q || sName.includes(q) || cNo.includes(q) || sPhone.includes(q)
    const matchStatus = statusFilter === 'all' || String(c?.status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  // Open 1-Click Mass Broadcast Modal
  const handleOpenMassBroadcast = () => {
    const queueList = pendingChallans.map(c => ({
      id: c.id || c.challanNo,
      challanNo: c.challanNo,
      studentId: c.studentId,
      studentName: c.studentName,
      class: c.class,
      month: c.month,
      total: c.total,
      dueDate: c.dueDate,
      feeBreakdown: c.feeBreakdown,
      studentPhone: c.studentPhone || '',
      dispatchStatus: 'Ready', // 'Ready', 'Sending', 'Delivered', 'Failed'
    }))

    if (queueList.length === 0) {
      toast.info('No pending fee challans to broadcast. All students are cleared!')
      return
    }

    setBroadcastQueue(queueList)
    setBroadcastModalOpen(true)
  }

  // 1-Click Mass Broadcast Execution
  const handleExecuteMassBroadcast = async () => {
    if (broadcastQueue.length === 0) return
    setIsBroadcasting(true)
    setBroadcastProgress({ current: 0, total: broadcastQueue.length })

    await whatsappService.broadcastBatchChallans(
      broadcastQueue,
      (current, total, result) => {
        setBroadcastProgress({ current, total })
        setBroadcastQueue(prev => prev.map(item =>
          item.challanNo === result.challanNo
            ? { ...item, dispatchStatus: result.status, dispatchedAt: result.timestamp }
            : item
        ))
      },
      school.name
    )

    setIsBroadcasting(false)
    toast.success(`🎉 Mass broadcast completed! Sent fee challans to all ${broadcastQueue.length} student WhatsApp numbers.`)
  }

  // Generate Challans & Open Broadcast
  const handleGenerateAndOpenBroadcast = async () => {
    setGenerating(true)
    try {
      const created = await challanService.generate(genMonth, '2026-08-30')
      await loadData()
      setGenerating(false)
      setGenerateOpen(false)

      const latestChallans = await challanService.getAll({ month: genMonth, status: 'Pending' })
      const queueList = (latestChallans || []).map(c => ({
        id: c.id || c.challanNo,
        challanNo: c.challanNo,
        studentId: c.studentId,
        studentName: c.studentName,
        class: c.class,
        month: c.month,
        total: c.total,
        dueDate: c.dueDate,
        feeBreakdown: c.feeBreakdown,
        studentPhone: c.studentPhone || '',
        dispatchStatus: 'Ready',
      }))

      setBroadcastQueue(queueList)
      setBroadcastModalOpen(true)
      toast.success(`${created.length || queueList.length} challans generated! Mass broadcast queue ready.`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate challans')
      setGenerating(false)
    }
  }

  const handleSaveQueuePhone = (index) => {
    const updated = [...broadcastQueue]
    updated[index].studentPhone = tempPhone
    setBroadcastQueue(updated)
    setEditingPhoneIdx(null)
    toast.success('WhatsApp number updated for broadcast')
  }

  // Single WhatsApp Verification
  const handleOpenSingleVerify = (challan) => {
    setSingleVerifyChallan(challan)
    setVerifyPhone(challan.studentPhone || '')
  }

  const handleSendSingleWhatsApp = async () => {
    if (!singleVerifyChallan) return
    try {
      await whatsappService.sendChallanWhatsApp(singleVerifyChallan, verifyPhone, school.name)
      toast.success(`WhatsApp voucher launched for ${singleVerifyChallan.studentName}`)
      setSingleVerifyChallan(null)
      loadData()
    } catch (err) {
      toast.error('Failed to send WhatsApp message')
    }
  }

  const handleDownloadAll = () => {
    downloadCSV('challans.csv', filtered.map(c => ({
      ChallanNo: c.challanNo || c.id,
      Student: c.studentName || 'Student',
      Class: c.class || '8-B',
      WhatsApp: c.studentPhone || '',
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
        title="E-Challans & Automated WhatsApp Billing"
        subtitle="Generate monthly fee vouchers and automate 1-click WhatsApp delivery to all enrolled students"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleDownloadAll}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            {/* Prominent Send To All Button */}
            <Button
              onClick={handleOpenMassBroadcast}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-emerald-100" />
              <span>Send to All via WhatsApp ({pendingChallans.length})</span>
            </Button>
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Generate Monthly Challans</span>
            </Button>
          </div>
        }
      />

      {/* Automated Monthly Billing Engine Status Banner */}
      <div className="mb-6 p-4 rounded-card bg-gradient-to-r from-emerald-50 via-teal-50 to-surface-app border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-emerald-950">
                Automated Monthly Billing Engine: <span className="text-emerald-700">Active</span>
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                Day {autoConfig.dispatchDayOfMonth || 1} of Every Month
              </span>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              When the monthly billing date arrives, fee vouchers are automatically generated for all enrolled students and queued for WhatsApp broadcast without manual effort.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => navigate('/settings')}
            className="text-xs font-semibold text-ink-secondary hover:text-ink flex items-center gap-1 px-3 py-1.5 rounded-btn bg-white/80 border border-border transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-ink-muted" />
            <span>Billing Rules</span>
          </button>
          <Button
            size="sm"
            onClick={handleOpenMassBroadcast}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Broadcast Now ({pendingChallans.length})
          </Button>
        </div>
      </div>

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
            placeholder="Search by student, challan #, or WhatsApp number..."
            value={search}
            onChange={setSearch}
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
          title="No challans generated yet"
          description="Click Generate Monthly Challans to create fee vouchers and automatically send them to all parent WhatsApp numbers."
          action={<Button onClick={() => setGenerateOpen(true)}>Generate Monthly Challans</Button>}
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
                  <th className="table-header">Parent WhatsApp</th>
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
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td
                      className="table-cell font-mono text-xs font-semibold text-primary cursor-pointer hover:underline"
                      onClick={() => navigate(`/challans/${c.id || c.challanNo}`)}
                    >
                      {c.challanNo || c.id}
                    </td>
                    <td className="table-cell font-medium text-ink">{c.studentName || 'Student'}</td>
                    <td className="table-cell text-sm text-ink-secondary">{c.class || '8-B'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-ink-secondary">{c.studentPhone || 'Not set'}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenSingleVerify(c)}
                          title="Verify & Send WhatsApp Voucher"
                          className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-ink-secondary">{c.month || 'August 2026'}</td>
                    <td className="table-cell font-semibold text-ink">{formatPKRFull(c.total || c.amount || 0)}</td>
                    <td className="table-cell text-sm text-ink-secondary">{formatDate(c.dueDate || '2026-08-10')}</td>
                    <td className="table-cell"><StatusBadge status={c.status || 'Pending'} /></td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenSingleVerify(c)}
                          title="Verify WhatsApp & Send"
                          className="text-xs py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                        >
                          <Send className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          WhatsApp
                        </Button>
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

      {/* 1. Generate Challans Modal */}
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Monthly Fee Challans">
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 rounded-card border border-emerald-200 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>Automated 1-Click WhatsApp Delivery:</strong> Generating challans will calculate tuition fees, lab dues, and discounts for all students, and immediately load the <strong>Send to All</strong> broadcast queue.
            </div>
          </div>

          <Select label="Billing Month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)}>
            <option value="August 2026">August 2026</option>
            <option value="September 2026">September 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="November 2026">November 2026</option>
          </Select>

          <Select label="Target Class" value={genClass} onChange={(e) => setGenClass(e.target.value)}>
            <option value="all">All Classes (Full School)</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(c => (
              <option key={c} value={c}>{`Class ${c}`}</option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateAndOpenBroadcast} disabled={generating}>
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Invoices...
                </>
              ) : (
                'Generate & Open Broadcast'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Interactive "Send to All" Mass WhatsApp Broadcast Modal */}
      <Modal
        open={broadcastModalOpen}
        onClose={() => !isBroadcasting && setBroadcastModalOpen(false)}
        title="Mass WhatsApp Challan Broadcast (Send to All)"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-ink-muted">
              {isBroadcasting
                ? `Sending ${broadcastProgress.current} of ${broadcastProgress.total}...`
                : `${broadcastQueue.length} student challans ready for broadcast`}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBroadcastModalOpen(false)} disabled={isBroadcasting}>
                Close
              </Button>
              <Button
                onClick={handleExecuteMassBroadcast}
                disabled={isBroadcasting || broadcastQueue.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Broadcasting ({broadcastProgress.current}/{broadcastProgress.total})...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1.5" />
                    Send to All WhatsApp Numbers ({broadcastQueue.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-card text-xs text-emerald-900 leading-relaxed">
            Click <strong>"Send to All WhatsApp Numbers"</strong> to broadcast itemized fee vouchers to all parents in one go. Students with no phone number set will be highlighted — please verify or edit numbers before broadcasting.
          </div>

          {/* Live Animated Progress Bar */}
          {isBroadcasting && (
            <div className="space-y-1.5 p-3 rounded-card bg-surface-app border border-border">
              <div className="flex justify-between text-xs font-bold text-ink">
                <span>Broadcasting Challans to All Parents...</span>
                <span>{Math.round((broadcastProgress.current / broadcastProgress.total) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Queue List */}
          <div className="max-h-80 overflow-y-auto border border-border rounded-card divide-y divide-border">
            {broadcastQueue.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-surface-hover">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{item.studentName}</p>
                    <span className="text-xs font-mono text-primary px-1.5 py-0.5 rounded bg-primary-light">
                      {item.challanNo}
                    </span>
                    <span className="text-xs text-ink-muted">({item.class})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-muted">Amount: <strong>{formatPKRFull(item.total)}</strong></span>
                  </div>
                </div>

                {/* WhatsApp Editable Field & Status */}
                <div className="flex items-center gap-2">
                  {editingPhoneIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className="input text-xs py-1 px-2 w-36"
                        placeholder="03001234567"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveQueuePhone(idx)}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Save number"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-surface-app px-2.5 py-1 rounded-btn border border-border">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-mono font-medium text-ink">{item.studentPhone || 'Not set'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhoneIdx(idx)
                          setTempPhone(item.studentPhone)
                        }}
                        className="text-ink-muted hover:text-primary ml-1"
                        title="Edit WhatsApp number"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Direct 1-Click Launch Button */}
                  <button
                    type="button"
                    onClick={() => pdfGenerator.viewChallanPDF(item)}
                    className="px-1.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    title="View Challan PDF"
                  >
                    <FileText className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      whatsappService.sendChallanWhatsApp(item, item.studentPhone, school.name)
                      const updated = [...broadcastQueue]
                      updated[idx].dispatchStatus = 'Delivered'
                      setBroadcastQueue(updated)
                      toast.success(`WhatsApp voucher launched for ${item.studentName}`)
                    }}
                    className="px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-colors"
                    title="Launch WhatsApp Chat for this student"
                  >
                    <Send className="w-3 h-3 text-emerald-600" />
                    Send
                  </button>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    item.dispatchStatus === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.dispatchStatus === 'Sending'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-surface-app text-ink-secondary border border-border'
                  }`}>
                    {item.dispatchStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 3. Single WhatsApp Number Verification & Send Modal */}
      {singleVerifyChallan && (
        <Modal
          open={!!singleVerifyChallan}
          onClose={() => setSingleVerifyChallan(null)}
          title="Verify WhatsApp & Dispatch Challan"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSingleVerifyChallan(null)}>Cancel</Button>
              <Button onClick={handleSendSingleWhatsApp} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="w-4 h-4 mr-1.5" />
                Dispatch to WhatsApp
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-card border border-emerald-200 text-xs text-emerald-900">
              Review and verify the parent's WhatsApp number before sending the fee voucher notification.
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-app p-3 rounded-btn border border-border">
              <div><span className="text-ink-muted">Student:</span> <strong className="text-ink block">{singleVerifyChallan.studentName}</strong></div>
              <div><span className="text-ink-muted">Challan #:</span> <strong className="text-ink block font-mono">{singleVerifyChallan.challanNo}</strong></div>
              <div><span className="text-ink-muted">Month:</span> <span className="text-ink block">{singleVerifyChallan.month}</span></div>
              <div><span className="text-ink-muted">Total Due:</span> <strong className="text-ink block text-emerald-700">{formatPKRFull(singleVerifyChallan.total)}</strong></div>
            </div>

            <Input
              label="Recipient WhatsApp Number *"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              placeholder="e.g. 03001234567 or +923001234567"
              helper="Updating this number will also save it to the student's profile for future automated challans."
            />

            <div>
              <p className="text-xs font-semibold text-ink mb-1.5">Formatted Message Preview:</p>
              <div className="p-3 rounded-card bg-surface-app border border-border font-mono text-[11px] whitespace-pre-wrap text-ink-secondary max-h-44 overflow-y-auto">
                {whatsappService.generateChallanMessage(singleVerifyChallan, school.name)}
              </div>
              <button
                type="button"
                onClick={() => pdfGenerator.viewChallanPDF(singleVerifyChallan)}
                className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Open Challan PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
