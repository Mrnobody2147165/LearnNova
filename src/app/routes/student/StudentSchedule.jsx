import { useState } from 'react'
import { Clock, MapPin } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import { studentSchedule } from '../../../data/academics'

export default function StudentSchedule() {
  const [activeDay, setActiveDay] = useState('Monday')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaySchedule = studentSchedule.find(s => s.day === today) || studentSchedule[0]

  return (
    <div>
      <PageHeader title="My Schedule" subtitle="Your weekly class timetable" />

      {/* Today's Schedule */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-ink mb-4">Today's Classes — {today}</h3>
        <div className="space-y-2">
          {todaySchedule.periods.map((period, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-3 rounded-btn ${
                period.subject === 'Break' ? 'bg-surface-app' : 'bg-white border border-border'
              }`}
            >
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                <Clock className="w-4 h-4 text-ink-muted" />
                <span className="text-sm font-medium text-ink">{period.time}</span>
              </div>
              {period.subject !== 'Break' ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{period.subject}</p>
                    <p className="text-xs text-ink-muted">{period.teacher}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    {period.room}
                  </div>
                </>
              ) : (
                <span className="text-sm text-ink-muted">Break</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <Tabs
          tabs={studentSchedule.map(s => ({ id: s.day, label: s.day.slice(0, 3) }))}
          activeTab={activeDay}
          onChange={setActiveDay}
          className="mb-4"
        />
        <div className="space-y-2">
          {studentSchedule.find(s => s.day === activeDay)?.periods.map((period, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-3 rounded-btn ${
                period.subject === 'Break' ? 'bg-surface-app' : 'bg-white border border-border'
              }`}
            >
              <div className="flex items-center gap-2 w-20 flex-shrink-0">
                <Clock className="w-4 h-4 text-ink-muted" />
                <span className="text-sm font-medium text-ink">{period.time}</span>
              </div>
              {period.subject !== 'Break' ? (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{period.subject}</p>
                    <p className="text-xs text-ink-muted">{period.teacher}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    {period.room}
                  </div>
                </>
              ) : (
                <span className="text-sm text-ink-muted">Break</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
