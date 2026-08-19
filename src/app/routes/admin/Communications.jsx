import { useState } from 'react'
import { Send, Bell, MessageSquare, Megaphone } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Select from '../../../components/ui/Select'
import Tabs from '../../../components/ui/Tabs'
import EmptyState from '../../../components/ui/EmptyState'
import { useToast } from '../../../components/ui/Toast'
import { formatDate } from '../../../utils/format'

const mockHistory = [
  { id: 'MSG-1', audience: 'All Parents', subject: 'Fee Reminder - August 2026', message: 'Dear parents, this is a reminder that August fees are due by the 10th. Please ensure timely payment.', date: '2026-08-05', sent: 1842, status: 'Sent' },
  { id: 'MSG-2', audience: 'Class 8-B', subject: 'Parent-Teacher Meeting', message: 'A parent-teacher meeting is scheduled for August 15th at 10 AM in the school auditorium.', date: '2026-08-03', sent: 64, status: 'Sent' },
  { id: 'MSG-3', audience: 'All Parents', subject: 'School Holiday Notice', message: 'The school will remain closed on August 14th for Independence Day.', date: '2026-08-01', sent: 1842, status: 'Sent' },
  { id: 'MSG-4', audience: 'Class 10-A', subject: 'Exam Schedule Released', message: 'The midterm exam schedule for Class 10-A has been released. Please check the school portal.', date: '2026-07-28', sent: 85, status: 'Sent' },
]

export default function Communications() {
  const toast = useToast()
  const [tab, setTab] = useState('compose')
  const [form, setForm] = useState({ audience: 'all', classSelect: '', subject: '', message: '' })
  const [history, setHistory] = useState(mockHistory)

  const tabs = [
    { id: 'compose', label: 'Compose' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'history', label: 'Notification History' },
  ]

  const handleSend = (e) => {
    e.preventDefault()
    if (!form.subject || !form.message) {
      toast.error('Subject and message are required')
      return
    }
    const audienceLabel = form.audience === 'all' ? 'All Parents' : form.audience === 'class' ? `Class ${form.classSelect}` : 'Specific Students'
    const newMsg = {
      id: 'MSG-' + (history.length + 1),
      audience: audienceLabel,
      subject: form.subject,
      message: form.message,
      date: new Date().toISOString().split('T')[0],
      sent: form.audience === 'all' ? 1842 : form.audience === 'class' ? 64 : 15,
      status: 'Sent',
    }
    setHistory(prev => [newMsg, ...prev])
    setForm({ audience: 'all', classSelect: '', subject: '', message: '' })
    toast.success('Message sent successfully to parents')
  }

  return (
    <div>
      <PageHeader title="Communications" subtitle="Send announcements and messages to parents" />

      <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-6" />

      {tab === 'compose' && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-ink">New Message</h3>
            </div>
            <Select label="Audience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="all">All Parents</option>
              <option value="class">Specific Class</option>
              <option value="students">Specific Students</option>
            </Select>
            {form.audience === 'class' && (
              <Select label="Select Class" value={form.classSelect} onChange={(e) => setForm({ ...form, classSelect: e.target.value })}>
                <option value="">Select a class</option>
                {['6', '7', '8', '9', '10'].map(c => <option key={c} value={c}>{`Class ${c}`}</option>)}
              </Select>
            )}
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Fee Reminder - August 2026" />
            <div>
              <label className="label">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Type your message here..."
                rows={5}
                className="input resize-none"
              />
            </div>
            <Button type="submit" className="w-full">
              <Send className="w-4 h-4" /> Send Message
            </Button>
          </form>
        </Card>
      )}

      {tab === 'announcements' && (
        <div className="space-y-4">
          {mockHistory.slice(0, 2).map(msg => (
            <Card key={msg.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-ink">{msg.subject}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">{msg.audience} • {formatDate(msg.date)}</p>
                  <p className="text-sm text-ink-secondary mt-2">{msg.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <Card padding={false}>
          {history.length === 0 ? (
            <EmptyState icon={Bell} title="No messages sent" description="Your sent messages will appear here." />
          ) : (
            <div className="divide-y divide-border">
              {history.map(msg => (
                <div key={msg.id} className="p-4 hover:bg-surface-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-9 h-9 rounded-btn bg-surface-app flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-ink-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink">{msg.subject}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{msg.audience} • {formatDate(msg.date)}</p>
                        <p className="text-sm text-ink-secondary mt-1 line-clamp-2">{msg.message}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-ink-muted">{msg.sent} sent</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
