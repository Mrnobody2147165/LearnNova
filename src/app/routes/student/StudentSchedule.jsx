import { Calendar, Clock, MapPin } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import { useAuthStore } from '../../../stores/authStore'

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const scheduleData = {
  Monday: [
    { time: '08:00 - 08:45', subject: 'Mathematics', room: 'Room 201' },
    { time: '08:50 - 09:35', subject: 'English', room: 'Room 201' },
    { time: '09:40 - 10:25', subject: 'Science', room: 'Lab 1' },
    { time: '10:25 - 10:45', subject: 'Break', room: '' },
    { time: '10:45 - 11:30', subject: 'Urdu', room: 'Room 201' },
    { time: '11:35 - 12:20', subject: 'Social Studies', room: 'Room 201' },
  ],
  Tuesday: [
    { time: '08:00 - 08:45', subject: 'English', room: 'Room 201' },
    { time: '08:50 - 09:35', subject: 'Mathematics', room: 'Room 201' },
    { time: '09:40 - 10:25', subject: 'Urdu', room: 'Room 201' },
    { time: '10:25 - 10:45', subject: 'Break', room: '' },
    { time: '10:45 - 11:30', subject: 'Science', room: 'Lab 1' },
    { time: '11:35 - 12:20', subject: 'Physical Education', room: 'Ground' },
  ],
  Wednesday: [
    { time: '08:00 - 08:45', subject: 'Science', room: 'Lab 1' },
    { time: '08:50 - 09:35', subject: 'Mathematics', room: 'Room 201' },
    { time: '09:40 - 10:25', subject: 'English', room: 'Room 201' },
    { time: '10:25 - 10:45', subject: 'Break', room: '' },
    { time: '10:45 - 11:30', subject: 'Social Studies', room: 'Room 201' },
    { time: '11:35 - 12:20', subject: 'Urdu', room: 'Room 201' },
  ],
  Thursday: [
    { time: '08:00 - 08:45', subject: 'Mathematics', room: 'Room 201' },
    { time: '08:50 - 09:35', subject: 'Science', room: 'Lab 1' },
    { time: '09:40 - 10:25', subject: 'Urdu', room: 'Room 201' },
    { time: '10:25 - 10:45', subject: 'Break', room: '' },
    { time: '10:45 - 11:30', subject: 'English', room: 'Room 201' },
    { time: '11:35 - 12:20', subject: 'Social Studies', room: 'Room 201' },
  ],
  Friday: [
    { time: '08:00 - 08:45', subject: 'English', room: 'Room 201' },
    { time: '08:50 - 09:35', subject: 'Urdu', room: 'Room 201' },
    { time: '09:40 - 10:25', subject: 'Mathematics', room: 'Room 201' },
    { time: '10:25 - 10:45', subject: 'Break', room: '' },
    { time: '10:45 - 11:30', subject: 'Science', room: 'Lab 1' },
    { time: '11:35 - 12:20', subject: 'Islamic Studies', room: 'Room 201' },
  ],
}

export default function StudentSchedule() {
  const { user } = useAuthStore()
  const today = new Date().getDay()
  const todayIndex = today >= 1 && today <= 5 ? today - 1 : 0

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Schedule"
        subtitle={`Weekly timetable — Class ${user?.class || ''}-${user?.section || ''}`}
      />

      <div className="space-y-4">
        {weekDays.map((day, di) => {
          const periods = scheduleData[day] || []
          const isToday = di === todayIndex
          return (
            <div key={day}>
              <h3 className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : 'text-ink'}`}>
                {day} {isToday && <span className="text-xs font-normal text-primary">(Today)</span>}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {periods.map((p, pi) => {
                  const isBreak = p.subject === 'Break'
                  return (
                    <Card
                      key={pi}
                      className={`p-3 ${isBreak ? 'bg-surface-app border-dashed' : ''} ${isToday ? 'ring-1 ring-primary/20' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isBreak ? 'text-ink-muted' : 'text-ink'}`}>{p.subject}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {p.time}
                            </span>
                            {p.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {p.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
