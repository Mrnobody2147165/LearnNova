import { useEffect, useState, useCallback } from 'react'
import { Plus, Send, Eye, Trash2, MessageSquare, Users, School, User, Search } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Modal from '../../../components/ui/Modal'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useToast } from '../../../components/ui/Toast'
import messageService from '../../../services/messages'
import studentService from '../../../services/students'
import classService from '../../../services/classes'
import { cn } from '../../../utils/format'

export default function Messages() {
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])

  // Compose form
  const [form, setForm] = useState({
    recipientType: 'all',
    recipientId: '',
    recipientName: '',
    subject: '',
    body: '',
  })
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [msgs, stus, cls] = await Promise.all([
        messageService.getAll(),
        studentService.getAll(),
        classService.getAll(),
      ])
      setMessages(msgs || [])
      setStudents(stus || [])
      setClasses(cls || [])
    } catch (err) {
      console.warn('Messages fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = messages.filter(msg =>
    !search ||
    msg.subject?.toLowerCase().includes(search.toLowerCase()) ||
    msg.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
    msg.body?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCompose = async () => {
    const errs = {}
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.body.trim()) errs.body = 'Message body is required'
    if (form.recipientType === 'class' && !form.recipientId) errs.recipientId = 'Select a class'
    if (form.recipientType === 'student' && !form.recipientId) errs.recipientId = 'Select a student'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSending(true)
    try {
      await messageService.send({
        ...form,
        recipientName: form.recipientType === 'all'
          ? 'All Students'
          : form.recipientType === 'class'
            ? classes.find(c => c.id === form.recipientId)?.name || form.recipientId
            : students.find(s => s.id === form.recipientId)?.name || form.recipientId,
      })
      toast.success('Message sent successfully.')
      setComposeOpen(false)
      setForm({ recipientType: 'all', recipientId: '', recipientName: '', subject: '', body: '' })
      setErrors({})
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return
    try {
      await messageService.delete(id)
      toast.success('Message deleted.')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete message')
    }
  }

  const getRecipientIcon = (type) => {
    switch (type) {
      case 'all': return <Users className="w-4 h-4" />
      case 'class': return <School className="w-4 h-4" />
      case 'student': return <User className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div className="p-6"><LoadingState /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Communicate with students"
        actions={
          <Button onClick={() => setComposeOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>New Message</span>
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages..."
          className="input pl-9 pr-4 py-2 text-sm w-full"
        />
      </div>

      {/* Messages List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Send your first message to communicate with students."
          action={<Button onClick={() => setComposeOpen(true)}>Compose Message</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-app">
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary">Subject</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary hidden sm:table-cell">Recipient</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-ink-secondary">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-ink-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(msg => (
                  <tr key={msg.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink truncate max-w-[200px] sm:max-w-[300px]">{msg.subject}</p>
                      <p className="text-xs text-ink-muted truncate mt-0.5 sm:hidden">{msg.recipientName}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                        {getRecipientIcon(msg.recipientType)}
                        {msg.recipientName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">{formatDate(msg.sentAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setSelectedMessage(msg); setViewOpen(true) }}
                          className="p-1.5 rounded-btn hover:bg-surface-hover text-ink-muted hover:text-ink transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1.5 rounded-btn hover:bg-danger-light text-ink-muted hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compose Modal */}
      <Modal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); setErrors({}) }}
        title="New Message"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleCompose} disabled={sending} className="gap-2">
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Recipient Type */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Recipient</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Students', icon: Users },
                { value: 'class', label: 'Class', icon: School },
                { value: 'student', label: 'Individual', icon: User },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, recipientType: opt.value, recipientId: '', recipientName: '' })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-btn text-sm font-medium border transition-colors',
                    form.recipientType === opt.value
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border text-ink-secondary hover:bg-surface-hover'
                  )}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Selection */}
          {form.recipientType === 'class' && (
            <Select
              label="Select Class"
              value={form.recipientId}
              onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
              error={errors.recipientId}
            >
              <option value="">Choose a class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.sections?.join(', ')})</option>
              ))}
            </Select>
          )}

          {form.recipientType === 'student' && (
            <Select
              label="Select Student"
              value={form.recipientId}
              onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
              error={errors.recipientId}
            >
              <option value="">Choose a student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id} — {s.class})</option>
              ))}
            </Select>
          )}

          <Input
            label="Subject"
            placeholder="e.g. Parent Meeting Notice"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            error={errors.subject}
          />

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Type your message here..."
              rows={5}
              className={cn('input w-full resize-none', errors.body && 'border-danger')}
            />
            {errors.body && <p className="text-xs text-danger mt-1">{errors.body}</p>}
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Message Details"
        size="md"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-ink-muted text-xs">Subject</p>
                <p className="font-medium text-ink">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-ink-muted text-xs">Recipient</p>
                <p className="text-ink flex items-center gap-1.5">
                  {getRecipientIcon(selectedMessage.recipientType)}
                  {selectedMessage.recipientName}
                </p>
              </div>
              <div>
                <p className="text-ink-muted text-xs">Date</p>
                <p className="text-ink">{formatDate(selectedMessage.sentAt)}</p>
              </div>
              <div>
                <p className="text-ink-muted text-xs">Status</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-bg text-success">
                  {selectedMessage.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-ink-muted text-xs mb-1">Message</p>
              <div className="bg-surface-app rounded-btn p-4 text-sm text-ink whitespace-pre-wrap">
                {selectedMessage.body}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
