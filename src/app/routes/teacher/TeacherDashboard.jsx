import { GraduationCap, BookOpen, Users, CalendarCheck, FileText } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'

export default function TeacherDashboard() {
  return (
    <div>
      <PageHeader title="Teacher Portal" subtitle="Welcome back, Sadia Rahman" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Classes" value="3" icon={BookOpen} />
        <StatCard label="My Students" value="178" icon={Users} />
        <StatCard label="Today's Classes" value="5" icon={CalendarCheck} />
        <StatCard label="Pending Grades" value="12" icon={FileText} />
      </div>
      <Card padding={false}>
        <div className="p-5 border-b border-border"><h3 className="text-base font-semibold text-ink">Today's Schedule</h3></div>
        <div className="divide-y divide-border">
          {[
            { time: '08:00 AM', subject: 'Mathematics', class: '9-A', room: 'Room 201' },
            { time: '09:30 AM', subject: 'Mathematics', class: '9-B', room: 'Room 201' },
            { time: '11:00 AM', subject: 'Statistics', class: '10-A', room: 'Room 105' },
            { time: '01:00 PM', subject: 'Mathematics', class: '9-A', room: 'Room 201' },
            { time: '02:30 PM', subject: 'Statistics', class: '10-A', room: 'Room 105' },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm font-medium text-ink">{s.subject} • {s.class}</p><p className="text-xs text-ink-muted">{s.room}</p></div>
              </div>
              <span className="text-sm text-ink-secondary">{s.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
