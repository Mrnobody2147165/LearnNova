import { useState, useEffect } from 'react'
import { Bell, Check, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import LoadingState from '../../../components/ui/LoadingState'
import notificationService from '../../../services/notifications'

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notificationService.getAll().then(data => {
      setNotifications(data || [])
      setLoading(false)
    })
  }, [])

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with announcements, homework, and exam alerts"
        actions={
          notifications.some(n => !n.read) && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <Check className="w-4 h-4" />
              Mark all as read
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up with your updates." />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={n.read ? 'opacity-75' : 'border-l-4 border-l-primary'}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-ink-secondary">{n.message}</p>
                  <span className="text-xs text-ink-muted block">{n.time}</span>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
