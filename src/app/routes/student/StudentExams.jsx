import { useState, useEffect } from 'react'
import { Clock, Calendar, BookOpen } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import Card from '../../../components/ui/Card'
import Tabs from '../../../components/ui/Tabs'
import StatusBadge from '../../../components/ui/StatusBadge'
import LoadingState from '../../../components/ui/LoadingState'
import EmptyState from '../../../components/ui/EmptyState'
import { exams, grades } from '../../../data/academics'
import { formatDate, formatDateShort } from '../../../utils/format'

export default function StudentExams() {
  const [examList, setExamList] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    const timer = setTimeout(() => {
      setExamList(exams)
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingState />

  const upcoming = examList.filter(e => e.status === 'Scheduled')
  const completed = examList.filter(e => e.status === 'Completed')

  const getExamGrade = (examId) => {
    const grade = grades.find(g => g.examId === examId && g.studentId === 'STU-2026-00124')
    return grade
  }

  return (
    <div>
      <PageHeader title="My Exams" subtitle="View upcoming and completed exams" />

      <Tabs
        tabs={[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'upcoming' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Calendar} title="No upcoming exams" description="You're all caught up!" />
            </div>
          ) : upcoming.map(exam => (
            <Card key={exam.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <StatusBadge status="Pending" />
              </div>
              <h3 className="text-base font-semibold text-ink">{exam.subject}</h3>
              <p className="text-sm text-ink-secondary mb-3">{exam.name}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Calendar className="w-4 h-4 text-ink-muted" /> {formatDate(exam.date)}
                </div>
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Clock className="w-4 h-4 text-ink-muted" /> {exam.startTime}
                </div>
                <p className="text-ink-secondary">{exam.description}</p>
                <p className="text-ink-muted text-xs">Total Marks: {exam.totalMarks}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={Calendar} title="No completed exams" description="Your completed exams will appear here" />
            </div>
          ) : completed.map(exam => {
            const grade = getExamGrade(exam.id)
            const classAvg = grade ? Math.round(grade.marks * 0.9) : null
            return (
              <Card key={exam.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-btn bg-success-bg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-success" />
                  </div>
                  <StatusBadge status="Completed" />
                </div>
                <h3 className="text-base font-semibold text-ink">{exam.subject}</h3>
                <p className="text-sm text-ink-secondary mb-3">{formatDateShort(exam.date)}</p>

                {grade ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-btn bg-surface-app">
                      <span className="text-sm text-ink-secondary">Score</span>
                      <span className="text-sm font-semibold text-ink">{grade.marks}/{grade.totalMarks}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-btn bg-surface-app">
                      <span className="text-sm text-ink-secondary">Grade</span>
                      <span className="text-sm font-semibold text-success">{grade.grade}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-btn bg-surface-app">
                      <span className="text-sm text-ink-secondary">Class Average</span>
                      <span className="text-sm font-semibold text-ink">{classAvg}</span>
                    </div>
                    {classAvg && (
                      <p className="text-xs text-success mt-2">
                        You scored {grade.marks - classAvg > 0 ? `${grade.marks - classAvg} above` : `${classAvg - grade.marks} below`} the class average
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">Results not yet published</p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
