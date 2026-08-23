import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import { studentNotifications } from '../../../data/academics'
import { cn } from '../../../utils/format'

export default function StudentNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(studentNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleClick = (notif) => {
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n))
    if (notif.link) navigate(notif.link)
  }

  const iconConfig = {
    info: { icon: Info, bg: 'bg-info-bg', text: 'text-info' },
    warning: { icon: AlertCircle, bg: 'bg-warning-bg', text: 'text-warning' },
    success: { icon: CheckCircle, bg: 'bg-success-bg', text: 'text-success' },
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
        actions={
          unreadCount > 0 ? (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          ) : null
        }
      />

      <Card padding={false}>
        <div className="divide-y divide-border">
          {notifications.map(notif => {
            const config = iconConfig[notif.type] || iconConfig.info
            const Icon = config.icon
            return (
              <div
                key={notif.id}
                className={cn(
                  'flex gap-3 px-5 py-4 hover:bg-surface-hover cursor-pointer transition-colors',
                  !notif.read && 'bg-primary-50/30'
                )}
                onClick={() => handleClick(notif)}
              >
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', config.bg)}>
                  <Icon className={cn('w-4 h-4', config.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink truncate">{notif.title}</p>
                    {!notif.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-ink-secondary mt-0.5">{notif.message}</p>
                  <p className="text-xs text-ink-muted mt-1">{notif.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
