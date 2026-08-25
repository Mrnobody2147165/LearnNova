import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import scheduleService from '../../../services/schedule'
import { useAuthStore } from '../../../stores/authStore'

export default function StudentSchedule() {
  const { user } = useAuthStore()
  const [schedule, setSchedule] = useState([])
  const [activeDay, setActiveDay] = useState('Monday')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scheduleService.getWeeklySchedule({ classFilter: user?.class, sectionFilter: user?.section }).then(data => {
      setSchedule(data || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const daySchedule = schedule.find(s => s.day === activeDay)?.periods || []
  const className = user?.class ? `Class ${user.class}${user.section ? `-${user.section}` : ''}` : 'Your Enrolled Class'

  return (
    <div>
      <PageHeader title="Class Schedule" subtitle={`Weekly timetable for ${className}`} />

      <Tabs
        tabs={[
          { id: 'Monday', label: 'Monday' },
          { id: 'Tuesday', label: 'Tuesday' },
          { id: 'Wednesday', label: 'Wednesday' },
          { id: 'Thursday', label: 'Thursday' },
          { id: 'Friday', label: 'Friday' },
        ]}
        activeTab={activeDay}
        onChange={setActiveDay}
        className="mb-6"
      />

      {daySchedule.length === 0 ? (
        <EmptyState icon={Calendar} title="No classes scheduled" description={`No timetable has been published for ${activeDay}.`} />
      ) : (
        <div className="space-y-3">
          {daySchedule.map((period, index) => (
            <Card key={index} className={period.subject === 'Break' ? 'bg-surface-app border-dashed' : ''}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-light text-primary">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{period.time}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">{period.subject}</h3>
                    {period.teacher && (
                      <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
                        <User className="w-3 h-3" />
                        <span>{period.teacher}</span>
                      </div>
                    )}
                  </div>
                </div>
                {period.room && (
                  <div className="flex items-center gap-1 text-xs font-medium text-ink-secondary bg-surface-app px-2 py-1 rounded-btn">
                    <MapPin className="w-3 h-3 text-ink-muted" />
                    <span>Room {period.room}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
