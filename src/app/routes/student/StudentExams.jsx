import { useState, useEffect } from 'react'
import { Calendar, Clock, Award } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import examService from '../../../services/exams'
import { useAuthStore } from '../../../stores/authStore'
import { formatDate } from '../../../utils/format'

export default function StudentExams() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('upcoming')
  const [examList, setExamList] = useState([])
  const [resultsList, setResultsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const studentId = user?.studentId || user?.id
    const studentClass = user?.class

    Promise.all([
      examService.getExams({ classFilter: studentClass }),
      examService.getStudentGrades(studentId),
    ]).then(([examsData, gradesData]) => {
      setExamList(examsData || [])
      setResultsList(gradesData || [])
      setLoading(false)
    })
  }, [user])

  if (loading) return <LoadingState />

  const upcoming = examList.filter(e => e.status === 'Scheduled')
  const completed = examList.filter(e => e.status === 'Completed' || e.resultsPublished)

  return (
    <div>
      <PageHeader title="Examinations" subtitle="View upcoming schedules and published results" />

      <Tabs
        tabs={[
          { id: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { id: 'results', label: `Results (${resultsList.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === 'upcoming' && (
        <div className="space-y-4">
          {upcoming.map(exam => (
            <Card key={exam.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{exam.subject}</h3>
                    <StatusBadge status={exam.status} />
                  </div>
                  <p className="text-sm text-ink-secondary">{exam.name} • {exam.description || 'All chapters'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-ink-secondary">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-ink-muted" />
                    <span>{formatDate(exam.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-ink-muted" />
                    <span>{exam.startTime || '10:00 AM'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    <Award className="w-4 h-4 text-primary" />
                    <span>{exam.totalMarks} Marks</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {upcoming.length === 0 && (
            <EmptyState icon={Calendar} title="No exams scheduled" description="Scheduled examinations for your class will be shown here." />
          )}
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-4">
          {resultsList.map(result => (
            <Card key={result.id || result.subject}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-ink">{result.subject}</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Overall: {result.overall}%</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{result.overall}%</span>
                  <p className="text-xs font-semibold text-success">Grade: {result.grade || 'A'}</p>
                </div>
              </div>
            </Card>
          ))}
          {resultsList.length === 0 && (
            <EmptyState icon={Award} title="No results published yet" description="Your exam evaluation results will appear here once marked by teachers." />
          )}
        </div>
      )}
    </div>
  )
}
