import { useState, useEffect } from 'react'
import { GraduationCap, BookOpen, Users, CalendarCheck, FileText } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import LoadingState from '../../../components/ui/LoadingState'
import studentService from '../../../services/students'
import { useAuthStore } from '../../../stores/authStore'

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentService.getTeacherDashboard().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingState />

  const teacherName = user?.name || 'Sadia Rahman'

  return (
    <div>
      <PageHeader title="Teacher Portal" subtitle={`Welcome back, ${teacherName}`} />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Classes" value={data?.classesCount || 3} icon={BookOpen} />
        <StatCard label="My Students" value={data?.studentsCount || 178} icon={Users} />
        <StatCard label="Today's Classes" value={data?.todayClassesCount || 5} icon={CalendarCheck} />
        <StatCard label="Pending Grades" value={data?.pendingGradesCount || 12} icon={FileText} />
      </div>

      <Card padding={false}>
        <div className="p-5 border-b border-border">
          <h3 className="text-base font-semibold text-ink">Today's Schedule</h3>
        </div>
        <div className="divide-y divide-border">
          {(data?.todaySchedule || []).map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{s.subject} • {s.class}</p>
                  <p className="text-xs text-ink-muted">{s.room}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-ink-secondary">{s.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
