import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Mail, MailOpen } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import { useAuthStore } from '../../../stores/authStore'
import { useToast } from '../../../components/ui/Toast'
import messageService from '../../../services/messages'
import { cn } from '../../../utils/format'

export default function StudentNotifications() {
  const { user } = useAuthStore()
  const toast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  const student = {
    studentId: user?.studentId || '',
    class: user?.class || '',
    section: user?.section || '',
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const data = await messageService.getForStudent(student)
      setMessages(data || [])
    } catch (err) {
      console.warn('Notifications fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMessages() }, [])

  const isRead = (msgId) => messageService.isRead(msgId, student.studentId)
  const unreadCount = messages.filter(m => !isRead(m.id)).length

  const handleMarkRead = async (msgId) => {
    await messageService.markAsRead(msgId, student.studentId)
    fetchMessages()
  }

  const handleMarkAllRead = async () => {
    await messageService.markAllAsRead(student.studentId)
    toast.success('All messages marked as read.')
    fetchMessages()
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) return <div className="p-6"><LoadingState /></div>

  const selectedMessage = messages.find(m => m.id === selectedId)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <Button onClick={handleMarkAllRead} variant="ghost" className="gap-2">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          ) : null
        }
      />

      {messages.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Messages from your school will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message List */}
          <div className="lg:col-span-1 space-y-2">
            {messages.map(msg => {
              const read = isRead(msg.id)
              return (
                <button
                  key={msg.id}
                  onClick={() => {
                    setSelectedId(msg.id)
                    if (!read) handleMarkRead(msg.id)
                  }}
                  className={cn(
                    'w-full text-left p-4 rounded-card border transition-colors',
                    selectedId === msg.id
                      ? 'border-primary bg-primary-light/30'
                      : read
                        ? 'border-border bg-white hover:bg-surface-hover'
                        : 'border-primary/30 bg-primary-light/10 hover:bg-primary-light/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {read
                        ? <MailOpen className="w-5 h-5 text-ink-muted" />
                        : <Mail className="w-5 h-5 text-primary" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm truncate', !read && 'font-semibold', 'text-ink')}>{msg.subject}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{formatDate(msg.sentAt)}</p>
                      <p className="text-xs text-ink-muted truncate mt-1">{msg.body?.substring(0, 60)}...</p>
                    </div>
                    {!read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-ink-muted">
                      <span>From: Admin</span>
                      <span>{formatDate(selectedMessage.sentAt)}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{selectedMessage.body}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 text-ink-muted text-sm">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
