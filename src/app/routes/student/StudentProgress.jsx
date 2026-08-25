import { useState, useEffect } from 'react'
import { TrendingUp, Award, BookOpen, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import StatCard from '../../../components/ui/StatCard'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import subjectService from '../../../services/subjects'
import examService from '../../../services/exams'
import { useAuthStore } from '../../../stores/authStore'

export default function StudentProgress() {
  const { user } = useAuthStore()
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class

    Promise.all([
      subjectService.getStudentSubjects(studentId, studentClass),
      examService.getStudentGrades(studentId),
    ]).then(([subData, grdData]) => {
      setSubjects(subData || [])
      setGrades(grdData || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const totalTopics = subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0)
  const completedTopics = subjects.reduce((sum, s) => sum + (s.topics?.filter(t => t.completed)?.length || 0), 0)
  const avgProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  const topSubject = subjects.length > 0
    ? [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0))[0]?.name
    : 'None'

  const progressData = [
    { month: 'Start', score: 0 },
    { month: 'Current', score: avgProgress },
  ]

  return (
    <div>
      <PageHeader title="Academic Progress" subtitle="Detailed breakdown of your learning curve and subject mastery" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Overall Mastery" value={`${avgProgress}%`} icon={TrendingUp} />
        <StatCard label="Completed Topics" value={`${completedTopics} / ${totalTopics}`} icon={CheckCircle} />
        <StatCard label="Top Subject" value={topSubject} icon={Award} />
      </div>

      <Card className="mb-6">
        <h3 className="text-base font-semibold text-ink mb-4">Academic Progression</h3>
        {totalTopics === 0 ? (
          <p className="text-sm text-ink-muted text-center py-10">No curriculum topics enrolled yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E4" />
              <XAxis dataKey="month" tick={{ fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748B' }} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {subjects.length === 0 ? (
        <EmptyState icon={BookOpen} title="No subjects found" description="Subjects will appear here once assigned to your class." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map(s => (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-ink">{s.name}</span>
                <span className="text-sm font-bold text-primary">{s.progress}%</span>
              </div>
              <div className="h-2 bg-surface-app rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full" style={{ width: `${s.progress}%` }} />
              </div>
              <p className="text-xs text-ink-muted">Teacher: {s.teacher}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
